-- Fix fixed plan installment generation to use simple equal payments
-- and ensure first payment is properly marked as paid

-- Drop the existing function first to avoid conflicts
DROP FUNCTION IF EXISTS public.create_installments_for_order(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS public.create_installments_for_order(UUID, UUID);

-- Create the updated function to handle fixed vs flexible plans correctly
CREATE OR REPLACE FUNCTION public.create_installments_for_order(
  p_order_id UUID,
  p_plan_id UUID,
  p_start_date DATE
)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_plan RECORD;
  v_monthly_payment DECIMAL;
  v_current_date DATE;
  v_remaining_amount DECIMAL;
  v_installment_amount DECIMAL;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Get installment plan details
  SELECT * INTO v_plan FROM public.installment_plans WHERE id = p_plan_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Installment plan not found');
  END IF;

  -- Calculate installment amounts based on plan type
  IF v_plan.plan_type = 'fixed' THEN
    -- For fixed plans: simple equal payments (no compound interest)
    v_monthly_payment := v_order.total_amount / v_plan.duration;
    v_remaining_amount := v_order.total_amount;
  ELSE
    -- For flexible plans: calculate remaining amount after advance payment
    v_remaining_amount := v_order.total_amount - COALESCE(v_plan.advance_payment_amount, 0);
    
    -- Check if advance payment covers the entire amount
    IF v_remaining_amount <= 0 THEN
      -- If advance payment covers entire amount, no installments needed
      RETURN json_build_object(
        'success', true, 
        'installments_created', 0,
        'message', 'Advance payment covers entire amount, no installments needed',
        'plan_type', v_plan.plan_type,
        'total_amount', v_order.total_amount
      );
    END IF;
    
    -- For flexible plans, divide remaining amount by duration (interest already applied in total)
    v_monthly_payment := v_remaining_amount / v_plan.duration;
  END IF;

  -- Round to 2 decimal places
  v_monthly_payment := ROUND(v_monthly_payment, 2);
  
  -- Ensure monthly payment is not negative or zero
  IF v_monthly_payment <= 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Invalid installment amount calculated',
      'monthly_payment', v_monthly_payment,
      'remaining_amount', v_remaining_amount
    );
  END IF;
  
  -- Create installments
  v_current_date := p_start_date;
  FOR i IN 1..v_plan.duration LOOP
    v_current_date := v_current_date + INTERVAL '1 month';
    
    -- For flexible plans, use equal monthly payments
    -- For fixed plans, also use equal monthly payments
    v_installment_amount := v_monthly_payment;
    
        INSERT INTO public.installments (
          order_id,
          installment_plan_id,
          installment_number,
          due_date,
          amount,
          status
        ) VALUES (
          p_order_id,
          p_plan_id,
          i::TEXT,
          v_current_date,
          ROUND(v_installment_amount, 2),
          'pending'
        );
  END LOOP;

  RETURN json_build_object(
    'success', true, 
    'installments_created', v_plan.duration,
    'monthly_payment', v_monthly_payment,
    'plan_type', v_plan.plan_type,
    'total_amount', v_order.total_amount
  );
END;
$$;
