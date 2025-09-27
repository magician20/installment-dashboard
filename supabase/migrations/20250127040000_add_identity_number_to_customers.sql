-- Add identity_number field to customers table
ALTER TABLE customers 
ADD COLUMN identity_number VARCHAR(14) UNIQUE;

-- Add comment to the column
COMMENT ON COLUMN customers.identity_number IS 'Egyptian national ID number (14 digits)';

-- Create index for faster lookups
CREATE INDEX idx_customers_identity_number ON customers(identity_number);
