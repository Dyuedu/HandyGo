-- Migration: Update subscriptions table to remove worker_id and add duration_days
-- This allows subscriptions to be managed independently and reused by multiple workers

-- Drop foreign key constraint if exists
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_worker_id;

-- Drop worker_id column if exists
ALTER TABLE subscriptions DROP COLUMN IF EXISTS worker_id;

-- Drop existing date columns if they exist
ALTER TABLE subscriptions DROP COLUMN IF EXISTS started_at;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS end_date;

-- Add duration_days column if not exists
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS duration_days INT NOT NULL DEFAULT 30;

-- Add created_at column if not exists
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update status column to have default value
ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'ACTIVE';

-- Add constraints
ALTER TABLE subscriptions ADD CONSTRAINT check_duration_days CHECK (duration_days > 0);
