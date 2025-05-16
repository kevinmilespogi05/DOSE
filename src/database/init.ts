import { pool } from '../utils/db';

async function initializeDatabase() {
  try {
    // Create users table first as it's referenced by other tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255),
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        reset_token VARCHAR(255),
        reset_token_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        mfa_secret VARCHAR(255),
        mfa_enabled TINYINT(1) DEFAULT 0,
        google_id VARCHAR(255),
        google_access_token TEXT,
        google_refresh_token TEXT,
        google_profile_picture VARCHAR(255),
        is_google_account TINYINT(1) DEFAULT 0
      )
    `);

    // Create medicine_categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicine_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create suppliers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create medicines table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        generic_name VARCHAR(100),
        brand VARCHAR(50),
        category_id INT,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        unit VARCHAR(20) NOT NULL,
        expiry_date DATE,
        supplier_id INT,
        requires_prescription TINYINT(1) DEFAULT 0,
        min_stock_level INT DEFAULT 10,
        max_stock_level INT DEFAULT 100,
        reorder_point INT DEFAULT 20,
        image_url VARCHAR(255) DEFAULT 'https://via.placeholder.com/400x300?text=Medicine+Image',
        barcode VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        FOREIGN KEY (category_id) REFERENCES medicine_categories(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      )
    `);

    // Create ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        medicine_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_verified_purchase BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        moderated_by INT,
        moderation_date TIMESTAMP NULL,
        moderation_reason VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
        FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create cart table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create cart_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cart_id INT NOT NULL,
        medicine_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
      )
    `);

    // Create wishlist_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        medicine_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_medicine (user_id, medicine_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
      )
    `);

    // Create user_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        phone_number VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state_province VARCHAR(100),
        country VARCHAR(100),
        postal_code VARCHAR(20),
        bio TEXT,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        avatar_url VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_profile (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the initialization function
export { initializeDatabase }; 