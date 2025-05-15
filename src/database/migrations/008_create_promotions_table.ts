import knex from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dose_db'
  }
};

async function createPromotionsTable() {
  try {
    const db = knex(dbConfig);
    
    // Check if the table already exists
    const tableExists = await db.schema.hasTable('promotions');
    
    if (!tableExists) {
      console.log('Creating promotions table...');
      
      await db.schema.createTable('promotions', (table) => {
        table.increments('id').primary();
        table.string('title', 255).notNullable();
        table.text('description').notNullable();
        table.string('image_url', 255).nullable();
        table.string('banner_url', 255).nullable();
        table.string('promotion_type', 50).notNullable().defaultTo('general'); // general, flash_sale, seasonal, etc.
        table.date('start_date').notNullable();
        table.date('end_date').notNullable();
        table.decimal('discount_percentage', 5, 2).nullable();
        table.decimal('discount_amount', 10, 2).nullable();
        table.boolean('is_featured').defaultTo(false);
        table.boolean('is_active').defaultTo(true);
        table.json('applicable_products').nullable(); // JSON array of product IDs or categories
        table.json('terms_conditions').nullable(); // JSON object with terms and conditions
        table.timestamps(true, true);
      });
      
      console.log('Promotions table created successfully');
    } else {
      console.log('Promotions table already exists');
    }
    
    await db.destroy();
    return { success: true, message: 'Promotions table migration completed' };
  } catch (error) {
    console.error('Error creating promotions table:', error);
    return { success: false, message: 'Failed to create promotions table', error };
  }
}

// Run the migration
createPromotionsTable()
  .then((result) => {
    console.log(result.message);
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled error in migration:', err);
    process.exit(1);
  }); 