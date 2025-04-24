import { pool } from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';

/**
 * Migration to update prescriptions table
 */
async function up() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Starting prescription table updates migration...');

    // Check if the prescriptions table exists
    const [tables] = await connection.query<RowDataPacket[]>(
      `SHOW TABLES LIKE 'prescriptions'`
    );

    if (tables.length > 0) {
      // Drop the existing table
      await connection.query(`DROP TABLE IF EXISTS prescription_items`);
      await connection.query(`DROP TABLE IF EXISTS prescriptions`);
      console.log('Dropped existing prescriptions tables');
    }

    // Create updated prescriptions table
    await connection.query(`
      CREATE TABLE prescriptions (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_prescriptions_user (user_id),
        KEY idx_prescriptions_status (status),
        CONSTRAINT prescriptions_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('Created prescriptions table');

    // Create prescription_items table for approved prescriptions
    await connection.query(`
      CREATE TABLE prescription_items (
        id INT NOT NULL AUTO_INCREMENT,
        prescription_id INT NOT NULL,
        medicine_id INT NOT NULL,
        quantity INT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY prescription_id (prescription_id),
        KEY medicine_id (medicine_id),
        CONSTRAINT prescription_items_prescription_fk FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE,
        CONSTRAINT prescription_items_medicine_fk FOREIGN KEY (medicine_id) REFERENCES medicines (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    console.log('Created prescription_items table');

    console.log('Prescription tables migration completed successfully');
  } catch (error) {
    console.error('Error during prescriptions migration:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Migration down (rollback) - would drop the tables
 */
async function down() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Rolling back prescription tables migration...');

    await connection.query(`DROP TABLE IF EXISTS prescription_items`);
    await connection.query(`DROP TABLE IF EXISTS prescriptions`);

    // Recreate original tables (simplified)
    await connection.query(`
      CREATE TABLE prescriptions (
        id int(11) NOT NULL AUTO_INCREMENT,
        patient_name varchar(100) NOT NULL,
        doctor_name varchar(100) NOT NULL,
        issue_date date NOT NULL,
        expiry_date date NOT NULL,
        status enum('ACTIVE','COMPLETED','EXPIRED') DEFAULT 'ACTIVE',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        KEY idx_prescription_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    await connection.query(`
      CREATE TABLE prescription_items (
        id int(11) NOT NULL AUTO_INCREMENT,
        prescription_id int(11) NOT NULL,
        medicine_id int(11) NOT NULL,
        quantity int(11) NOT NULL,
        dosage varchar(100) DEFAULT NULL,
        instructions text DEFAULT NULL,
        PRIMARY KEY (id),
        KEY prescription_id (prescription_id),
        KEY medicine_id (medicine_id),
        CONSTRAINT prescription_items_ibfk_1 FOREIGN KEY (prescription_id) REFERENCES prescriptions (id),
        CONSTRAINT prescription_items_ibfk_2 FOREIGN KEY (medicine_id) REFERENCES medicines (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);

    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Error during rollback:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the migration
up().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 