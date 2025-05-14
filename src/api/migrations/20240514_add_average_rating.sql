SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Add average_rating column to medicines table
ALTER TABLE medicines ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;

SET FOREIGN_KEY_CHECKS = 1;
