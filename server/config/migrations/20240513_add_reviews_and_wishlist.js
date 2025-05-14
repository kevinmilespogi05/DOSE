exports.up = function(knex) {
  return knex.schema
    // Create reviews table
    .createTable('reviews', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('medicine_id').unsigned().notNullable();
      table.integer('rating').unsigned().notNullable();
      table.text('comment');
      table.boolean('is_verified_purchase').defaultTo(false);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.foreign('medicine_id').references('medicines.id').onDelete('CASCADE');
      
      // Ensure one review per user per medicine
      table.unique(['user_id', 'medicine_id']);
    })
    
    // Create wishlist table
    .createTable('wishlist_items', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('medicine_id').unsigned().notNullable();
      table.timestamps(true, true);
      
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.foreign('medicine_id').references('medicines.id').onDelete('CASCADE');
      
      // Ensure one wishlist entry per user per medicine
      table.unique(['user_id', 'medicine_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('reviews')
    .dropTableIfExists('wishlist_items');
}; 