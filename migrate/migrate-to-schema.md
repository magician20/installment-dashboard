# Migration Guide: Update Supabase Schema

## Overview
This guide explains how to apply the new installment plan schema to your Supabase database to support **fixed** and **flexible** installment plans.

## Required Migration
A new migration file has been created: 
- `supabase/migrations/20250927005040_update_installment_plans_schema.sql`

This migration:
1. **Adds plan_type column**: Choose between 'fixed' or 'flexible' plans
2. **Adds advance_payment_amount column**: For flexible plans (stored as EGP amount)
3. **Maintains backward compatibility**: Existing plans become 'fixed' type

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Push the migration to your live database
npx supabase db push

# Or if using remote connection
npx supabase db push --password your-db-password
```

### Option 2: Supabase Dashboard UI
1. Open your Supabase project dashboard
2. Go to **Database** → **Migrations**  
3. Click **"Apply pending migrations"** or **"Run migration file"**
4. Copy and paste the SQL from the migration file

### Option 3: Direct SQL Execution
1. Open **SQL Editor** in Supabase dashboard  
2. Copy the contents of `supabase/migrations/20250927005040_update_installment_plans_schema.sql`
3. Run the SQL

## After Migration Success

### 1. Regenerate Type Definitions 
```bash
# Generate TypeScript types from the updated schema
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts

# For remote connection
npx supabase gen types typescript --remote --password your-db-password > src/integrations/supabase/types.ts
```

### 2. Update Type Definitions Manually (If Needed)
If auto-generation fails, manually update `src/integrations/supabase/types.ts` section for `installment_plans`:

```typescript
installment_plans: {
  Row: {
    created_at: string | null
    duration: number
    grace_period: number
    id: string
    interest_rate: number
    name: string
    plan_type: 'fixed' | 'flexible'  // NEW
    advance_payment_amount: number | null  // NEW
    updated_at: string | null
  }
  Insert: {
    created_at?: string | null
    duration: number
    grace_period?: number
    id?: string
    interest_rate?: number
    name: string
    plan_type: 'fixed' | 'flexible'  // NEW
    advance_payment_amount?: number | null  // NEW
    updated_at?: string | null
  }
  Update: {
    created_at?: string | null
    duration?: number
    grace_period?: number
    id?: string
    interest_rate?: number
    name?: string
    plan_type?: 'fixed' | 'flexible'  // NEW
    advance_payment_amount?: number | null  // NEW
    updated_at?: string | null
  }
  // ... rest unchanged
}
```

### 3. Verify Migration Success
Test the migration worked by:

1. **Check database schema**:
   ```sql
   SELECT plan_type, advance_payment_amount, name 
   FROM public.installment_plans 
   LIMIT 5;
   ```

2. **Test creating a flexible plan**:
   - In your app, try creating an installment plan  
   - Select "Flexible" plan type
   - Enter an advance payment amount
   - Verify it saves correctly

3. **Check that existing plans are now "fixed"**:
   - All existing installment plans should now have `plan_type = 'fixed'`
   - New flexible plans can have an `advance_payment_amount`

## Migration Safety Notes ⚠️

- **✅ Safe migration**: This doesn't modify existing data structure - only adds new columns
- **✅ Backward compatible**: All existing plans remain fully functional  
- **✅ Zero downtime**: Application continues working during migration
- **✅ Reversible**: If needed, the migration can be undone by dropping the new columns

## Rollback (If Needed)
To undo this migration:
```sql
ALTER TABLE public.installment_plans 
DROP COLUMN advance_payment_amount,
DROP COLUMN plan_type;
```

But this will lose all flexible plan data, so backup first.


