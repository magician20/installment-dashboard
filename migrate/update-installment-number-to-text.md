# Update Installment Number to Text Type

## Overview
This update changes the `installment_number` column in the `installments` table from `INTEGER` to `TEXT` to support descriptive values like "Advance Payment" for flexible installment plans.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/20250927030000_update_installment_number_to_text.sql`

**Changes:**
- Drop existing constraint `installments_installment_number_check` (installment_number > 0)
- Drop unique constraint on `(order_id, installment_number)`
- Change column type from `INTEGER` to `TEXT`
- Add new constraint to ensure installment_number is not empty
- Recreate unique constraint on `(order_id, installment_number)`
- Update existing data to string format

### 2. TypeScript Types Update
**File:** `src/integrations/supabase/types.ts`

**Changes:**
- Updated `installment_number` from `number` to `string` in:
  - `Row` interface
  - `Insert` interface  
  - `Update` interface

### 3. Hook Interface Update
**File:** `src/hooks/useInstallments.ts`

**Changes:**
- Updated `Installment` interface: `installment_number: number` → `installment_number: string`
- Updated `CreateInstallmentData` interface: `installment_number: number` → `installment_number: string`

### 4. Database Function Update
**File:** `supabase/migrations/20250927010000_fix_fixed_plan_installments.sql`

**Changes:**
- Updated installment creation to cast `i` to `TEXT`: `i::TEXT`

### 5. Order Dialog Logic Update
**File:** `src/components/forms/OrderDialog.tsx`

**Changes:**
- For flexible plans, create advance payment installment with `installment_number: 'Advance Payment'`
- Link payment record to the advance payment installment

## Benefits

### 1. **Flexible Plan Support**
- Advance payments can now be labeled as "Advance Payment" instead of numeric values
- Clear distinction between advance payments and regular monthly installments

### 2. **Better User Experience**
- Payment records show descriptive installment numbers
- Easier to identify advance payments in the UI

### 3. **Data Consistency**
- All installment numbers are now strings, providing consistency
- Maintains unique constraint per order

## Example Usage

### Fixed Plan Installments
```sql
-- Regular monthly installments
INSERT INTO installments (installment_number, ...) VALUES ('1', ...);
INSERT INTO installments (installment_number, ...) VALUES ('2', ...);
INSERT INTO installments (installment_number, ...) VALUES ('3', ...);
```

### Flexible Plan Installments
```sql
-- Advance payment
INSERT INTO installments (installment_number, ...) VALUES ('Advance Payment', ...);

-- Regular monthly installments
INSERT INTO installments (installment_number, ...) VALUES ('1', ...);
INSERT INTO installments (installment_number, ...) VALUES ('2', ...);
INSERT INTO installments (installment_number, ...) VALUES ('3', ...);
```

## Migration Steps

1. **Apply Database Migration:**
   ```bash
   npx supabase db push
   ```

2. **Update Application Code:**
   - The TypeScript types and interfaces have been updated
   - The database function has been updated
   - The order creation logic has been updated

3. **Test the Changes:**
   - Create a new flexible plan order
   - Verify advance payment shows as "Advance Payment" in installment number
   - Verify regular installments show as "1", "2", "3", etc.

## Validation

### Database Constraints
- `installment_number` cannot be NULL or empty string
- `(order_id, installment_number)` must be unique per order

### Application Logic
- Fixed plans: Use numeric strings ("1", "2", "3", ...)
- Flexible plans: Use "Advance Payment" for advance payment, then numeric strings for monthly installments

## Backward Compatibility

- Existing numeric installment numbers are automatically converted to strings
- No data loss occurs during migration
- All existing functionality remains intact


