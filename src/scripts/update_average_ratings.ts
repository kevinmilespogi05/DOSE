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

async function updateAllAverageRatings() {
    try {
        // Update all medicines' average ratings
        await pool.execute(`
            UPDATE medicines m
            SET m.average_rating = (
                SELECT COALESCE(AVG(r.rating), 0)
                FROM ratings r
                WHERE r.medicine_id = m.id
            );
        `);
        console.log('Successfully updated average ratings for all medicines');
    } catch (error) {
        console.error('Error updating average ratings:', error);
    } finally {
        await pool.end();
    }
}

updateAllAverageRatings(); 