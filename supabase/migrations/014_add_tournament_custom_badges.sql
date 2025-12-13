-- Add custom badge fields to tournaments table
ALTER TABLE tournaments
ADD COLUMN badge_1st_label text,
ADD COLUMN badge_1st_image_url text,
ADD COLUMN badge_2nd_label text,
ADD COLUMN badge_2nd_image_url text,
ADD COLUMN badge_3rd_label text,
ADD COLUMN badge_3rd_image_url text;
