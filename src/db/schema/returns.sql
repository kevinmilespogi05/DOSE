-- Returns table
CREATE TABLE returns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  total_refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Return items table
CREATE TABLE return_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  return_id INT NOT NULL,
  order_item_id INT NOT NULL,
  quantity INT NOT NULL,
  reason ENUM('wrong_item', 'damaged', 'defective', 'not_as_described', 'other') NOT NULL,
  condition ENUM('new', 'like_new', 'used', 'damaged') NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);

-- Refunds table
CREATE TABLE refunds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  return_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  processed_by INT NOT NULL,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  failure_reason TEXT,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_returns_user_id ON returns(user_id);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_return_items_return_id ON return_items(return_id);
CREATE INDEX idx_return_items_order_item_id ON return_items(order_item_id);
CREATE INDEX idx_refunds_return_id ON refunds(return_id);
CREATE INDEX idx_refunds_status ON refunds(status); 