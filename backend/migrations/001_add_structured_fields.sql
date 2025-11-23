-- Migration: Add structured fields to dog_sightings table
-- Date: 2025-11-22
-- Description: Add tamano, color, estado, notas columns for structured data entry

-- Add new columns
ALTER TABLE dog_sightings
ADD COLUMN IF NOT EXISTS tamano VARCHAR(20),
ADD COLUMN IF NOT EXISTS color VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(50),
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN dog_sightings.tamano IS 'Dog size: pequeño, mediano, grande';
COMMENT ON COLUMN dog_sightings.color IS 'Dog color(s): café, negro, blanco, etc.';
COMMENT ON COLUMN dog_sightings.estado IS 'Dog health status: saludable, herido, desnutrido';
COMMENT ON COLUMN dog_sightings.notas IS 'Additional notes from the user';
COMMENT ON COLUMN dog_sightings.user_description IS 'Auto-generated description from structured fields (for backwards compatibility)';

-- Note: user_description column is kept for backwards compatibility
-- It will be auto-generated from the structured fields going forward
