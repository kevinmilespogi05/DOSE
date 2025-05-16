import { up as initialSetup } from './migrations/001_initial_setup';
import { up as createCoupons } from './migrations/007_create_coupons_table';
import { up as createPromotions } from './migrations/008_create_promotions_table';
import { up as userProfiles } from './migrations/006_user_profiles_and_features';
import { up as createMfa } from './migrations/007_create_mfa_table';

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    // Run migrations in order
    await initialSetup();
    await userProfiles();
    await createMfa();
    await createCoupons();
    await createPromotions();
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations(); 