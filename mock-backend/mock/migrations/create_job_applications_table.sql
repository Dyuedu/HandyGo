-- Job applications: workers register for customer job posts
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_post_id UUID NOT NULL,
    worker_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_application_post FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_job_application_worker FOREIGN KEY (worker_id) REFERENCES worker_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_job_application_worker UNIQUE (job_post_id, worker_id)
);

CREATE INDEX idx_job_applications_post ON job_applications(job_post_id);
CREATE INDEX idx_job_applications_worker ON job_applications(worker_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);

ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS assigned_worker_id UUID;
ALTER TABLE job_posts ADD CONSTRAINT fk_job_posts_assigned_worker
    FOREIGN KEY (assigned_worker_id) REFERENCES worker_profile(id);
