-- Migration: Add hospital Google Maps link, pincode, and district fields for QueueLess

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS google_maps_link VARCHAR(1024);

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(32);

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS district VARCHAR(255);
