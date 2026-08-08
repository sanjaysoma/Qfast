-- Migration: Add hospital location columns for QueueLess
-- Run this in your PostgreSQL database if the columns do not already exist.

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS city VARCHAR(255);

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- Add district to patients
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS district VARCHAR(255);

-- Add state and district to hospitals
ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS state VARCHAR(255);
