import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'project_db',
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
        console.error('Could not connect to MySQL server. Make sure it is running.');
      } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        console.error('Access denied. Check your database username and password.');
      } else if (error.message.includes('ER_BAD_DB_ERROR')) {
        console.error('Database "project_db" does not exist. Create it before running the application.');
      }
    }
    return false;
  }
}

export { pool, testConnection }; 