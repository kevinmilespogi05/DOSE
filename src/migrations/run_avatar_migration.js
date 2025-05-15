import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function runMigration() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dose_db'
  };

  try {
    // Create connection
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');

    // Read and execute the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'src', 'migrations', 'add_avatar_url_column.sql'),
      'utf8'
    );

    await connection.query(migrationSQL);
    console.log('Migration completed successfully');

    // Close connection
    await connection.end();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration(); 