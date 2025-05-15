import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateTable() {
  // Database configuration
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dose_db'
  };

  console.log('Connecting to database:', dbConfig.database);
  
  try {
    // Create connection
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('Connection established successfully');
    
    // Check if columns already exist
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM user_profiles 
      WHERE Field IN ('date_of_birth', 'gender')
    `);
    
    console.log('Found existing columns:', columns.length);
    
    // If columns don't exist, add them
    if (columns.length < 2) {
      console.log('Adding missing columns...');
      
      // Add date_of_birth column if it doesn't exist
      if (!columns.find(col => col.Field === 'date_of_birth')) {
        await connection.query(`
          ALTER TABLE user_profiles 
          ADD COLUMN date_of_birth DATE DEFAULT NULL AFTER bio
        `);
        console.log('Added date_of_birth column');
      }
      
      // Add gender column if it doesn't exist
      if (!columns.find(col => col.Field === 'gender')) {
        await connection.query(`
          ALTER TABLE user_profiles 
          ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT NULL AFTER date_of_birth
        `);
        console.log('Added gender column');
      }
      
      console.log('Table update completed successfully');
    } else {
      console.log('Columns already exist, no changes needed');
    }
    
    // Close connection
    await connection.end();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('Error updating table:', error);
  }
}

// Run the function
updateTable(); 