-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop the existing foreign keys
ALTER TABLE ratings DROP FOREIGN KEY ratings_ibfk_1;
ALTER TABLE ratings DROP FOREIGN KEY ratings_ibfk_2;

-- Drop the unique index
DROP INDEX unique_user_medicine ON ratings;

-- Recreate the foreign keys
ALTER TABLE ratings
ADD CONSTRAINT ratings_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT ratings_ibfk_2 FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1; 