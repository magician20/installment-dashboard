-- Update installment_number column to TEXT type to support "Advance Payment" for flexible plans
-- Date: 2025-09-27
-- Description: Change installment_number from INTEGER to TEXT to allow descriptive values like "Advance Payment"

-- Step 1: Drop the existing constraint that requires installment_number > 0
ALTER TABLE public.installments 
DROP CONSTRAINT IF EXISTS installments_installment_number_check;

-- Step 2: Drop the unique constraint on (order_id, installment_number)
ALTER TABLE public.installments 
DROP CONSTRAINT IF EXISTS installments_order_id_installment_number_key;

-- Step 3: Change the column type from INTEGER to TEXT
ALTER TABLE public.installments 
ALTER COLUMN installment_number TYPE TEXT USING installment_number::TEXT;

-- Step 4: Add a new constraint to ensure installment_number is not empty
ALTER TABLE public.installments 
ADD CONSTRAINT installments_installment_number_not_empty 
CHECK (installment_number IS NOT NULL AND installment_number != '');

-- Step 5: Recreate the unique constraint on (order_id, installment_number)
ALTER TABLE public.installments 
ADD CONSTRAINT installments_order_id_installment_number_unique 
UNIQUE (order_id, installment_number);

-- Step 6: Add a comment to document the change
COMMENT ON COLUMN public.installments.installment_number IS 'Installment identifier - can be numeric (1, 2, 3...) for regular installments or descriptive text (e.g., "Advance Payment") for special payments';

-- Step 7: Update any existing data to ensure consistency
-- Convert existing numeric values to string format if needed
UPDATE public.installments 
SET installment_number = installment_number::TEXT 
WHERE installment_number IS NOT NULL;

-- Step 8: Refresh the schema cache
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'installments' 
AND table_schema = 'public'
AND column_name = 'installment_number';


