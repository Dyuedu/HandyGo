CREATE TABLE IF NOT EXISTS worker_reviews (
    id BIGSERIAL PRIMARY KEY,
    worker_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_worker_reviews_worker FOREIGN KEY (worker_id) REFERENCES worker_profile(id),
    CONSTRAINT fk_worker_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES user_profile(id),
    CONSTRAINT uk_worker_reviews_worker_reviewer UNIQUE (worker_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_worker_reviews_worker ON worker_reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_reviews_reviewer ON worker_reviews(reviewer_id);
