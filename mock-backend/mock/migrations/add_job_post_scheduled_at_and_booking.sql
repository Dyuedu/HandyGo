-- Scheduled appointment time for job posts + link to booking when accepted
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;
UPDATE job_posts
SET scheduled_at = COALESCE(created_at, CURRENT_TIMESTAMP) + INTERVAL '1 day'
WHERE scheduled_at IS NULL;
ALTER TABLE job_posts ALTER COLUMN scheduled_at SET NOT NULL;

ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS booking_id UUID;
ALTER TABLE job_posts ADD CONSTRAINT fk_job_posts_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id);

CREATE INDEX IF NOT EXISTS idx_job_posts_scheduled_at ON job_posts(scheduled_at);
