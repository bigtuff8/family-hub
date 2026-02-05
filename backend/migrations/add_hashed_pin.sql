-- Migration: Add hashed_pin column to users table
-- Date: 2026-02-05
-- Description: Adds PIN authentication support for kiosk login

-- Add the hashed_pin column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'hashed_pin'
    ) THEN
        ALTER TABLE users ADD COLUMN hashed_pin VARCHAR(255);
        RAISE NOTICE 'Added hashed_pin column to users table';
    ELSE
        RAISE NOTICE 'hashed_pin column already exists in users table';
    END IF;
END $$;
