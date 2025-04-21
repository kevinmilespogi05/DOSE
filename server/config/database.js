import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'project_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('Creating database pool with config:', {
  host: poolConfig.host,
  user: poolConfig.user,
  database: poolConfig.database
});

// Create and export the pool
const pool = mysql.createPool(poolConfig);

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connection successful');
    connection.release();
  })
  .catch(error => {
    console.error('Database connection failed:', error);
    throw error;
  });

export default pool;