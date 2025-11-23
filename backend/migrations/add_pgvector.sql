-- Migration: Add pgvector extension and image_embedding column
-- Run this migration on your PostgreSQL database

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add image_embedding column to dog_sightings table
ALTER TABLE dog_sightings
ADD COLUMN IF NOT EXISTS image_embedding vector(1408);

-- Step 3: Create index for faster vector similarity search
CREATE INDEX IF NOT EXISTS dog_sightings_embedding_idx
ON dog_sightings
USING ivfflat (image_embedding vector_cosine_ops)
WITH (lists = 100);

-- Note: For production with >10K rows, consider using HNSW index instead:
-- CREATE INDEX dog_sightings_embedding_idx ON dog_sightings
-- USING hnsw (image_embedding vector_cosine_ops);
