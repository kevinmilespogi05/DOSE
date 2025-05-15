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

async function createCouponsTable() {
  try {
    const db = knex(dbConfig);
    console.log('Creating coupons table...');
    
    // Check if the table already exists
    const couponsTableExists = await db.schema.hasTable('coupons');
    
    if (!couponsTableExists) {
      await db.schema.createTable('coupons', (table) => {
        table.increments('id').primary();
        table.string('code', 20).notNullable().unique();
        table.enum('discount_type', ['percentage', 'fixed']).notNullable();
        table.decimal('discount_value', 10, 2).notNullable();
        table.decimal('min_purchase_amount', 10, 2).nullable();
        table.decimal('max_discount_amount', 10, 2).nullable();
        table.dateTime('start_date').notNullable();
        table.dateTime('end_date').notNullable();
        table.integer('usage_limit').nullable();
        table.integer('used_count').notNullable().defaultTo(0);
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamps(true, true);
        table.index('code', 'idx_coupon_code');
        table.index(['start_date', 'end_date', 'is_active'], 'idx_coupon_dates');
      });
      
      console.log('Coupons table created successfully');
    } else {
      console.log('Coupons table already exists');
    }
    
    // Check if the order_coupons table already exists
    const orderCouponsTableExists = await db.schema.hasTable('order_coupons');
    
    if (!orderCouponsTableExists) {
      console.log('Creating order_coupons table...');
      
      await db.schema.createTable('order_coupons', (table) => {
        table.increments('id').primary();
        table.string('order_id', 36).notNullable();
        table.integer('coupon_id').unsigned().notNullable();
        table.decimal('discount_amount', 10, 2).notNullable();
        table.timestamps(true, true);
        table.foreign('coupon_id').references('coupons.id');
        table.unique('order_id', 'idx_order_coupon');
      });
      
      console.log('Order coupons table created successfully');
    } else {
      console.log('Order coupons table already exists');
    }
    
    // Add some sample coupons if the table was just created
    if (!couponsTableExists) {
      console.log('Adding sample coupons...');
      
      const currentDate = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      await db('coupons').insert([
        {
          code: 'WELCOME10',
          discount_type: 'percentage',
          discount_value: 10,
          min_purchase_amount: 1000,
          max_discount_amount: 500,
          start_date: currentDate,
          end_date: nextMonth,
          usage_limit: 100,
          is_active: true
        },
        {
          code: 'SAVE20',
          discount_type: 'percentage',
          discount_value: 20,
          min_purchase_amount: 2000,
          max_discount_amount: 1000,
          start_date: currentDate,
          end_date: nextMonth,
          usage_limit: 50,
          is_active: true
        },
        {
          code: 'FLAT100',
          discount_type: 'fixed',
          discount_value: 100,
          min_purchase_amount: 500,
          max_discount_amount: null,
          start_date: currentDate,
          end_date: nextMonth,
          usage_limit: null,
          is_active: true
        }
      ]);
      
      console.log('Sample coupons added successfully');
    }
    
    await db.destroy();
    return { success: true, message: 'Coupons migration completed successfully' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, message: 'Failed to create coupons tables', error };
  }
}

async function run() {
  try {
    const result = await createCouponsTable();
    console.log(result.message);
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
run(); 