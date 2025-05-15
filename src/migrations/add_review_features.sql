-- Add verified purchase and moderation fields to ratings table
ALTER TABLE ratings
ADD COLUMN is_verified_purchase BOOLEAN DEFAULT FALSE,
ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
ADD COLUMN moderated_by INT NULL,
ADD COLUMN moderation_date TIMESTAMP NULL,
ADD COLUMN moderation_reason VARCHAR(255) NULL,
ADD CONSTRAINT fk_ratings_moderated_by FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for faster filtering of ratings by status
CREATE INDEX idx_ratings_status ON ratings(status);

-- Create index for faster lookup of ratings by medicine and status
CREATE INDEX idx_ratings_medicine_status ON ratings(medicine_id, status); 