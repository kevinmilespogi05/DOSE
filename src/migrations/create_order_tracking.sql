CREATE TABLE order_tracking (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Insert initial tracking statuses for existing orders
INSERT INTO order_tracking (id, order_id, status, description)
SELECT 
    CONCAT(o.id, '-', UNIX_TIMESTAMP()), 
    o.id,
    CASE 
        WHEN o.status = 'completed' THEN 'delivered'
        WHEN o.status = 'payment_approved' THEN 'processing'
        WHEN o.status = 'processing' THEN 'preparing'
        ELSE 'pending'
    END,
    CASE 
        WHEN o.status = 'completed' THEN 'Order has been delivered successfully'
        WHEN o.status = 'payment_approved' THEN 'Order is being processed'
        WHEN o.status = 'processing' THEN 'Order is being prepared'
        ELSE 'Order is pending payment'
    END
FROM orders o; 