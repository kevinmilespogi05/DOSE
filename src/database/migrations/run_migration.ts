import { execute } from '../../utils/db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    // Drop existing table
    await execute('DROP TABLE IF EXISTS payments;');
    
    // Create new table
    await execute(`
      CREATE TABLE payments (
        id varchar(36) NOT NULL,
        order_id varchar(36) NOT NULL,
        amount decimal(10,2) NOT NULL,
        payment_method enum('gcash', 'grab_pay') NOT NULL,
        source_id varchar(100),
        payment_intent_id varchar(100),
        reference_number varchar(100),
        payment_proof_url varchar(255),
        status enum('pending', 'processing', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (id),
        KEY order_id (order_id),
        CONSTRAINT payments_order_id_fk FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
  process.exit();
}

runMigration(); 