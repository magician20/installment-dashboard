-- Migration: Update installment_plans table to support fixed and flexible plan types
-- Date: 2025-09-27
-- Description: Add plan_type (fixed/flexible) and advance_payment_amount fields to installment_plans table

-- Add plan_type column with ENUM constraint
ALTER TABLE public.installment_plans 
ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'fixed' CHECK (plan_type IN ('fixed', 'flexible'));

-- Add advance_payment_amount column for flexible plans
ALTER TABLE public.installment_plans 
ADD COLUMN advance_payment_amount DECIMAL(10,2) NULL CHECK (advance_payment_amount IS NULL OR advance_payment_amount >= 0);

-- Update existing records to have plan_type = 'fixed' (already done by default)
-- Existing records will automatically get plan_type = 'fixed' due to the default value

-- Remove the default value constraint since we've initialized the existing data
-- For new records, plan_type must be explicitly specified
ALTER TABLE public.installment_plans 
ALTER COLUMN plan_type DROP DEFAULT;

-- Optional: Add comments to document the new fields
COMMENT ON COLUMN public.installment_plans.plan_type IS 'Plan type: fixed (standard duration-based) or flexible (with advance payment)';
COMMENT ON COLUMN public.installment_plans.advance_payment_amount IS 'Advance payment amount for flexible plans, null for fixed plans';

-- Ensure RLS policies are maintained
-- Existing policies should continue to work as before

-- Update any affected indexes if they exist (currently none that would be affected)

-- Note: No trigger updates needed as update_updated_at trigger will handle the new columns



