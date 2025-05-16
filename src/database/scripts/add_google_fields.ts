import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dose_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function addGoogleFields() {
  const pool = mysql.createPool(dbConfig);

  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS google_access_token TEXT,
      ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
      ADD COLUMN IF NOT EXISTS google_profile_picture VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_google_account BOOLEAN DEFAULT FALSE
    `);

    console.log('Successfully added Google authentication fields');
  } catch (error) {
    console.error('Error adding Google authentication fields:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute the function
addGoogleFields()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 