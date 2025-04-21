import { execute } from '../../utils/db';

export async function up() {
  // Create orders table
  await execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id varchar(36) NOT NULL,
      user_id int(11) NOT NULL,
      total_amount decimal(10,2) NOT NULL,
      status enum('pending_payment', 'payment_submitted', 'payment_approved', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending_payment',
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY user_id (user_id),
      CONSTRAINT orders_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // Create order items table
  await execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id int(11) NOT NULL AUTO_INCREMENT,
      order_id varchar(36) NOT NULL,
      medicine_id int(11) NOT NULL,
      quantity int(11) NOT NULL,
      unit_price decimal(10,2) NOT NULL,
      is_box boolean NOT NULL DEFAULT false,
      box_quantity int(11) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY order_id (order_id),
      KEY medicine_id (medicine_id),
      CONSTRAINT order_items_order_id_fk FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      CONSTRAINT order_items_medicine_id_fk FOREIGN KEY (medicine_id) REFERENCES medicines (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // Create payments table
  await execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id varchar(36) NOT NULL,
      order_id varchar(36) NOT NULL,
      amount decimal(10,2) NOT NULL,
      payment_method enum('gcash', 'grab_pay') NOT NULL,
      source_id varchar(100),
      payment_intent_id varchar(100),
      status enum('pending', 'processing', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      KEY order_id (order_id),
      CONSTRAINT payments_order_id_fk FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);
}

export async function down() {
  // Drop tables in reverse order
  await execute('DROP TABLE IF EXISTS payments');
  await execute('DROP TABLE IF EXISTS order_items');
  await execute('DROP TABLE IF EXISTS orders');
} 