import mysql from 'mysql2/promise';

async function up() {
    // Database configuration
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dose_db'
    };

    try {
        // Create connection
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // Create users table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                reset_token VARCHAR(255),
                reset_token_expires DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Ensured users table exists');

        // Create user_profiles table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                phone_number VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                state_province VARCHAR(100),
                country VARCHAR(100),
                postal_code VARCHAR(20),
                bio TEXT,
                avatar_url VARCHAR(255) DEFAULT NULL,
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_profile (user_id)
            )
        `);
        console.log('Ensured user_profiles table exists');

        // Check if avatar_url column exists
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM user_profiles 
            WHERE Field = 'avatar_url'
        `);

        if (columns.length === 0) {
            // Add avatar_url column if it doesn't exist
            await connection.query(`
                ALTER TABLE user_profiles 
                ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL 
                AFTER bio
            `);
            console.log('Added avatar_url column to user_profiles table');
        } else {
            console.log('avatar_url column already exists');
        }

        // Close connection
        await connection.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

up().then(() => {
    console.log('Migration completed');
    process.exit(0);
}).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
}); 