import { pool } from '../../config/database';

async function up() {
  try {
    // Create user_mfa table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_mfa (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        mfa_secret VARCHAR(255) NOT NULL,
        is_mfa_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_id (user_id)
      )
    `);

    console.log('MFA table created successfully');
  } catch (error) {
    console.error('Error creating MFA table:', error);
    throw error;
  }
}

async function down() {
  try {
    await pool.query('DROP TABLE IF EXISTS user_mfa');
    console.log('MFA table dropped successfully');
  } catch (error) {
    console.error('Error dropping MFA table:', error);
    throw error;
  }
}

// Run the migration
up().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 