import { pool } from '../config/database.ts';

const createWishlistTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        medicine_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_medicine (user_id, medicine_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
      )
    `);
    console.log('Wishlist items table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating wishlist items table:', error);
    process.exit(1);
  }
};

createWishlistTable(); 