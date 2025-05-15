import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testProfileUpdate() {
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
    
    // User ID to update (adjust as needed)
    const userId = 8;  // Change this to a valid user_id in your database
    
    // First, check if the user profile exists
    const [profiles] = await connection.query(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    
    console.log('Found user profile:', profiles.length > 0);
    
    if (profiles.length === 0) {
      console.log('Profile not found, creating one...');
      await connection.query(
        'INSERT INTO user_profiles (user_id) VALUES (?)',
        [userId]
      );
    }
    
    // Update the profile with test values
    const testData = {
      date_of_birth: '1990-01-01',
      gender: 'male'
    };
    
    console.log('Updating profile with test data:', testData);
    
    const [result] = await connection.query(
      `UPDATE user_profiles 
       SET date_of_birth = ?, gender = ?
       WHERE user_id = ?`,
      [testData.date_of_birth, testData.gender, userId]
    );
    
    console.log('Update result:', result);
    console.log('Affected rows:', result.affectedRows);
    
    // Verify the update
    const [updatedProfile] = await connection.query(
      'SELECT id, user_id, date_of_birth, gender FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    
    console.log('Updated profile data:', updatedProfile[0]);
    
    // Close connection
    await connection.end();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the function
testProfileUpdate(); 