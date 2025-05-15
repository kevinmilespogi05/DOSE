CREATE TABLE IF NOT EXISTS return_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  return_id INT NOT NULL,
  order_item_id INT NOT NULL,
  quantity INT NOT NULL,
  reason ENUM('wrong_item', 'damaged', 'defective', 'not_as_described', 'other') NOT NULL,
  item_condition ENUM('new', 'opened', 'damaged') NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id)
); 