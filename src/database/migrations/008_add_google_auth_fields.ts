import { pool } from '../../../src/config/database';

async function up() {
  try {
    // Add Google authentication fields to users table
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS google_access_token TEXT,
      ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
      ADD COLUMN IF NOT EXISTS google_profile_picture VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_google_account BOOLEAN DEFAULT FALSE
    `);

    console.log('Added Google authentication fields to users table');
  } catch (error) {
    console.error('Error adding Google authentication fields:', error);
    throw error;
  }
}

async function down() {
  try {
    // Remove Google authentication fields from users table
    await pool.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS google_id,
      DROP COLUMN IF EXISTS google_access_token,
      DROP COLUMN IF EXISTS google_refresh_token,
      DROP COLUMN IF EXISTS google_profile_picture,
      DROP COLUMN IF EXISTS is_google_account
    `);

    console.log('Removed Google authentication fields from users table');
  } catch (error) {
    console.error('Error removing Google authentication fields:', error);
    throw error;
  }
}

export { up, down }; 