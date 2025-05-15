-- Add avatar_url column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL; 