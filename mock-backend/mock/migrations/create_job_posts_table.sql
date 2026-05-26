-- Create JobPost Table
CREATE TABLE IF NOT EXISTS job_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(50) NOT NULL,
    address VARCHAR(500),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES user_profile(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_job_posts_customer_id ON job_posts(customer_id);
CREATE INDEX idx_job_posts_status ON job_posts(status);
CREATE INDEX idx_job_posts_job_type ON job_posts(job_type);
CREATE INDEX idx_job_posts_created_at ON job_posts(created_at);

-- Add comment for documentation
COMMENT ON TABLE job_posts IS 'Table for storing job posts created by customers for workers to discover';
