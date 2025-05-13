import { db } from '../connection';

async function up() {
  // User Profiles table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      profile_picture VARCHAR(255),
      phone_number VARCHAR(20),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Wishlists table
  await db.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_wishlist (user_id, product_id)
    );
  `);

  // Reviews table
  await db.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      is_verified_purchase BOOLEAN DEFAULT FALSE,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Add MFA fields to users table
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
  `);
}

async function down() {
  await db.query('DROP TABLE IF EXISTS reviews;');
  await db.query('DROP TABLE IF EXISTS wishlists;');
  await db.query('DROP TABLE IF EXISTS user_profiles;');
  
  await db.query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS mfa_enabled,
    DROP COLUMN IF EXISTS mfa_secret,
    DROP COLUMN IF EXISTS reset_token,
    DROP COLUMN IF EXISTS reset_token_expires;
  `);
}

export { up, down }; 