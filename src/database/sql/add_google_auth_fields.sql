-- Add Google authentication fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_profile_picture VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_google_account BOOLEAN DEFAULT FALSE; 