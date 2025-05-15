-- Rename condition column to item_condition to avoid reserved keyword
ALTER TABLE return_items CHANGE COLUMN `condition` item_condition VARCHAR(255) NOT NULL; 