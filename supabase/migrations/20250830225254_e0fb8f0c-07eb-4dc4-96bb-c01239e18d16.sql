-- Create Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  address TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Installment Plans table
CREATE TABLE public.installment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  duration INTEGER NOT NULL CHECK (duration > 0), -- Number of months
  interest_rate DECIMAL(5,4) NOT NULL CHECK (interest_rate >= 0), -- Annual interest rate
  grace_period INTEGER NOT NULL DEFAULT 0 CHECK (grace_period >= 0), -- Days
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'installment')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Installments table
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  installment_plan_id UUID NOT NULL REFERENCES public.installment_plans(id) ON DELETE RESTRICT,
  installment_number INTEGER NOT NULL CHECK (installment_number > 0),
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late', 'overdue')),
  late_fee DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (late_fee >= 0),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, installment_number)
);

-- Create Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer', 'mobile_money')),
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_date ON public.orders(order_date);
CREATE INDEX idx_installments_order ON public.installments(order_id);
CREATE INDEX idx_installments_due_date ON public.installments(due_date);
CREATE INDEX idx_installments_status ON public.installments(status);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_installment ON public.payments(installment_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);
CREATE INDEX idx_customers_email ON public.customers(email);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing full access for now - will restrict based on user roles later)
CREATE POLICY "Enable all operations for authenticated users" ON public.categories FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.products FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.customers FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.installment_plans FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.orders FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.installments FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.payments FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_installment_plans_updated_at BEFORE UPDATE ON public.installment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON public.installments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business Logic Functions

-- Function to create installments for an order
CREATE OR REPLACE FUNCTION public.create_installments_for_order(
  p_order_id UUID,
  p_installment_plan_id UUID
)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;

-- Function to process a payment (fixed parameter order)
CREATE OR REPLACE FUNCTION public.process_payment(
  p_order_id UUID,
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_installment_id UUID DEFAULT NULL,
  p_receipt_number TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;

-- Function to refresh installment late status
CREATE OR REPLACE FUNCTION public.refresh_installment_late_status(p_installment_id UUID)
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;

-- Function to mark overdue installments as late (for batch processing)
CREATE OR REPLACE FUNCTION public.mark_overdue_installments_late()
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;

-- Insert some sample data
INSERT INTO public.categories (name) VALUES 
  ('Electronics'),
  ('Mobile Phones'),
  ('Laptops'),
  ('Home Appliances'),
  ('Accessories');

INSERT INTO public.installment_plans (name, duration, interest_rate, grace_period) VALUES
  ('3 Months Plan', 3, 0.12, 7),
  ('6 Months Plan', 6, 0.15, 7),
  ('12 Months Plan', 12, 0.18, 5),
  ('24 Months Plan', 24, 0.20, 5);

INSERT INTO public.customers (first_name, last_name, email, phone_number, address) VALUES
  ('John', 'Doe', 'john.doe@email.com', '+1234567890', '123 Main St, City'),
  ('Jane', 'Smith', 'jane.smith@email.com', '+1234567891', '456 Oak Ave, Town');

INSERT INTO public.products (name, description, price, quantity, category_id) VALUES
  ('iPhone 15', 'Latest iPhone model with advanced features', 999.99, 50, (SELECT id FROM public.categories WHERE name = 'Mobile Phones')),
  ('Samsung Galaxy S24', 'Premium Android smartphone', 899.99, 30, (SELECT id FROM public.categories WHERE name = 'Mobile Phones')),
  ('MacBook Pro', 'Professional laptop for power users', 1999.99, 20, (SELECT id FROM public.categories WHERE name = 'Laptops'));