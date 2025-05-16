import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', 
  database: process.env.DB_NAME || 'project_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000, // 60 seconds
  acquireTimeout: 60000, // 60 seconds
  timeout: 60000, // 60 seconds
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : undefined
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Function to retry connection
async function retryConnection(maxRetries = 5, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const connection = await pool.getConnection();
      console.log('Database connected successfully');
      console.log(`Connected to ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
      connection.release();
      return true;
    } catch (error) {
      console.error(`Connection attempt ${i + 1}/${maxRetries} failed:`, error);
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

// Test the connection with retries
async function testConnection() {
  try {
    const connected = await retryConnection();
    if (!connected) {
      throw new Error('Failed to connect after maximum retries');
    }
    return true;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    
    // More detailed error handling
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.error('Could not connect to MySQL server. Make sure it is running.');
      } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        console.error('Access denied. Check your database username and password.');
      } else if (error.message.includes('ER_BAD_DB_ERROR')) {
        console.error(`Database "${dbConfig.database}" does not exist. Create it before running the application.`);
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error('Connection timed out. Check your network connection and database host.');
      }
    }
    return false;
  }
}

export { pool, testConnection }; 