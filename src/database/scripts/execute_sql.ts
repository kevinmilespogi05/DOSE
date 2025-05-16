import { pool } from '../../config/database';
import fs from 'fs';
import path from 'path';

async function executeSQLFile(filename: string) {
  try {
    const sqlPath = path.join(__dirname, '..', 'sql', filename);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log(`Successfully executed ${filename}`);
  } catch (error) {
    console.error(`Error executing ${filename}:`, error);
    throw error;
  }
}

// Execute the SQL file
executeSQLFile('add_google_auth_fields.sql')
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 