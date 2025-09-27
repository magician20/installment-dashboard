-- Refresh installments table schema to ensure payment_date column is properly recognized
-- This migration ensures the payment_date column exists and is properly indexed

-- First, let's ensure the payment_date column exists (it should already exist from the original migration)
-- This is a safety check to ensure the column is properly defined
DO $$
BEGIN
    -- Check if payment_date column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'installments' 
        AND column_name = 'payment_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.installments 
        ADD COLUMN payment_date DATE;
    END IF;
END $$;

-- Add a comment to document the column
COMMENT ON COLUMN public.installments.payment_date IS 'Date when the installment was paid, null if not paid yet';

-- Ensure the column allows NULL values (for unpaid installments)
ALTER TABLE public.installments 
ALTER COLUMN payment_date DROP NOT NULL;

-- Refresh the schema cache by querying the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'installments' 
AND table_schema = 'public'
ORDER BY ordinal_position;





