import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    
    // More detailed error handling
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error('Could not connect to database server. Check your connection details.');
      } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        console.error('Access denied. Check your database username and password.');
      } else if (error.message.includes('ER_BAD_DB_ERROR')) {
        console.error(`Database "${dbConfig.database}" does not exist.`);
      }
    }
    return false;
  }
}

export { pool, testConnection }; 