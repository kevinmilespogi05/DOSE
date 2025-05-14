import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'project_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function addAverageRatingColumn() {
    try {
        await pool.execute(
            'ALTER TABLE medicines ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;'
        );
        console.log('Successfully added average_rating column to medicines table');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column average_rating already exists');
        } else {
            console.error('Error adding average_rating column:', error);
        }
    } finally {
        await pool.end();
    }
}

addAverageRatingColumn(); 