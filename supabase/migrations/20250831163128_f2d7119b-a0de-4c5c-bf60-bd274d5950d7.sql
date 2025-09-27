-- Fix security warning: Set search_path for all functions to prevent SQL injection

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update create_installments_for_order function
CREATE OR REPLACE FUNCTION public.create_installments_for_order(
  p_order_id UUID,
  p_installment_plan_id UUID
)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_plan RECORD;
  v_monthly_rate DECIMAL;
  v_monthly_payment DECIMAL;
  v_current_date DATE;
  v_installment_count INTEGER;
  v_total_interest DECIMAL;
  v_last_payment DECIMAL;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Get installment plan details
  SELECT * INTO v_plan FROM public.installment_plans WHERE id = p_installment_plan_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Installment plan not found');
  END IF;

  -- Calculate monthly interest rate
  v_monthly_rate := v_plan.interest_rate / 12;
  
  -- Calculate monthly payment using compound interest formula
  IF v_plan.interest_rate > 0 THEN
    v_monthly_payment := v_order.total_amount * (v_monthly_rate * POWER(1 + v_monthly_rate, v_plan.duration)) / 
                        (POWER(1 + v_monthly_rate, v_plan.duration) - 1);
  ELSE
    v_monthly_payment := v_order.total_amount / v_plan.duration;
  END IF;

  -- Round to 2 decimal places
  v_monthly_payment := ROUND(v_monthly_payment, 2);
  
  -- Calculate the last payment to handle rounding differences
  v_total_interest := (v_monthly_payment * v_plan.duration) - v_order.total_amount;
  v_last_payment := v_order.total_amount + v_total_interest - (v_monthly_payment * (v_plan.duration - 1));

  -- Create installments
  v_current_date := v_order.order_date;
  FOR i IN 1..v_plan.duration LOOP
    v_current_date := v_current_date + INTERVAL '1 month';
    
    INSERT INTO public.installments (
      order_id,
      installment_plan_id,
      installment_number,
      due_date,
      amount,
      status
    ) VALUES (
      p_order_id,
      p_installment_plan_id,
      i,
      v_current_date,
      CASE WHEN i = v_plan.duration THEN v_last_payment ELSE v_monthly_payment END,
      'pending'
    );
  END LOOP;

  RETURN json_build_object(
    'success', true, 
    'installments_created', v_plan.duration,
    'monthly_payment', v_monthly_payment,
    'total_amount', v_order.total_amount + v_total_interest
  );
END;
$$;

-- Update process_payment function
CREATE OR REPLACE FUNCTION public.process_payment(
  p_order_id UUID,
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_installment_id UUID DEFAULT NULL,
  p_receipt_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
  v_installment RECORD;
  v_remaining_amount DECIMAL;
BEGIN
  -- Insert payment record
  INSERT INTO public.payments (
    order_id,
    installment_id,
    amount,
    payment_method,
    receipt_number,
    notes
  ) VALUES (
    p_order_id,
    p_installment_id,
    p_amount,
    p_payment_method,
    p_receipt_number,
    p_notes
  ) RETURNING id INTO v_payment_id;

  -- If payment is for a specific installment, update installment status
  IF p_installment_id IS NOT NULL THEN
    SELECT * INTO v_installment FROM public.installments WHERE id = p_installment_id;
    
    -- Calculate remaining amount needed for this installment
    SELECT COALESCE(v_installment.amount - SUM(p.amount), v_installment.amount)
    INTO v_remaining_amount
    FROM public.payments p
    WHERE p.installment_id = p_installment_id;

    -- Update installment status if fully paid
    IF v_remaining_amount <= 0 THEN
      UPDATE public.installments 
      SET status = 'paid', payment_date = CURRENT_DATE, updated_at = now()
      WHERE id = p_installment_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'remaining_amount', COALESCE(v_remaining_amount, 0)
  );
END;
$$;

-- Update refresh_installment_late_status function
CREATE OR REPLACE FUNCTION public.refresh_installment_late_status(p_installment_id UUID)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_installment RECORD;
  v_plan RECORD;
  v_days_overdue INTEGER;
BEGIN
  -- Get installment and plan details
  SELECT i.*, ip.grace_period
  INTO v_installment
  FROM public.installments i
  JOIN public.installment_plans ip ON i.installment_plan_id = ip.id
  WHERE i.id = p_installment_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Installment not found');
  END IF;

  -- Skip if already paid
  IF v_installment.status = 'paid' THEN
    RETURN json_build_object('success', true, 'status', 'paid', 'no_change', true);
  END IF;

  -- Calculate days overdue
  v_days_overdue := CURRENT_DATE - v_installment.due_date;

  -- Update status based on grace period
  IF v_days_overdue > v_installment.grace_period THEN
    UPDATE public.installments 
    SET status = 'late', updated_at = now()
    WHERE id = p_installment_id AND status != 'late';
    
    RETURN json_build_object('success', true, 'status', 'late', 'days_overdue', v_days_overdue);
  ELSE
    RETURN json_build_object('success', true, 'status', v_installment.status, 'days_overdue', v_days_overdue);
  END IF;
END;
$$;

-- Update mark_overdue_installments_late function
CREATE OR REPLACE FUNCTION public.mark_overdue_installments_late()
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.installments 
  SET status = 'late', updated_at = now()
  FROM public.installment_plans ip
  WHERE installments.installment_plan_id = ip.id
    AND installments.status = 'pending'
    AND (CURRENT_DATE - installments.due_date) > ip.grace_period;
    
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN json_build_object('success', true, 'updated_count', v_updated_count);
END;
$$;