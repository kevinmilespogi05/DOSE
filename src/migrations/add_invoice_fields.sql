-- Add invoice fields to payments table
ALTER TABLE payments 
ADD COLUMN invoice_number VARCHAR(50) UNIQUE,
ADD COLUMN invoice_generated_at TIMESTAMP NULL,
ADD COLUMN invoice_path VARCHAR(255) NULL;

-- Update existing completed payments with invoice numbers
UPDATE payments p
JOIN orders o ON p.order_id = o.id
SET p.invoice_number = CONCAT('INV-', DATE_FORMAT(o.created_at, '%Y%m'), '-', LPAD(p.id, 6, '0'))
WHERE p.status = 'approved' AND p.invoice_number IS NULL; 