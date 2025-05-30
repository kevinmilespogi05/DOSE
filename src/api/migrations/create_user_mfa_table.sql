CREATE TABLE IF NOT EXISTS user_mfa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    mfa_secret VARCHAR(255),
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_mfa (user_id)
); 