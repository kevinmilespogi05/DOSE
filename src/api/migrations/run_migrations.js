import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'project_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function runMigrations() {
    try {
        const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.sql'));
        
        for (const file of files) {
            const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
            console.log(`Running migration: ${file}`);
            await pool.query(sql);
            console.log(`Successfully ran migration: ${file}`);
        }
        
        console.log('All migrations completed successfully');
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        await pool.end();
        process.exit(1);
    }
}

runMigrations(); 