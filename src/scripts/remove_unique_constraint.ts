import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dose',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function removeUniqueConstraint() {
    try {
        // Disable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

        // Drop the existing foreign keys
        await pool.execute('ALTER TABLE ratings DROP FOREIGN KEY ratings_ibfk_1');
        await pool.execute('ALTER TABLE ratings DROP FOREIGN KEY ratings_ibfk_2');

        // Drop the unique index
        await pool.execute('DROP INDEX unique_user_medicine ON ratings');

        // Recreate the foreign keys
        await pool.execute(`
            ALTER TABLE ratings
            ADD CONSTRAINT ratings_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            ADD CONSTRAINT ratings_ibfk_2 FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
        `);

        // Re-enable foreign key checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Successfully removed unique constraint from ratings table');
    } catch (error) {
        console.error('Error removing unique constraint:', error);
    } finally {
        await pool.end();
    }
}

removeUniqueConstraint(); 