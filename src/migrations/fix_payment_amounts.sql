-- Fix payment amounts by dividing by 100
UPDATE payments
SET amount = amount / 100
WHERE amount > 1000 AND created_at < NOW();

-- Fix order total amounts that were affected
UPDATE orders o
JOIN payments p ON o.id = p.order_id
SET o.total_amount = p.amount
WHERE o.total_amount > 1000 AND o.created_at < NOW(); 