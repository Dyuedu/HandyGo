ALTER TABLE wallets
    ADD COLUMN IF NOT EXISTS locked_balance NUMERIC(19, 4) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    worker_id UUID NOT NULL,
    worker_username VARCHAR(100),
    worker_full_name VARCHAR(100),
    amount NUMERIC(19, 4) NOT NULL,
    bank_bin VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_no VARCHAR(40) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    transfer_content VARCHAR(140) NOT NULL,
    vietqr_payload VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_note VARCHAR(500),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_worker_status
    ON withdrawal_requests(worker_id, status);

CREATE INDEX IF NOT EXISTS idx_withdrawal_created_at
    ON withdrawal_requests(created_at);
