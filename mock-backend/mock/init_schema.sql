-- Bảng role
CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Bảng account
CREATE TABLE account (
    id UUID PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    status SMALLINT, -- Mặc định của EnumType.ORDINAL trong JPA
    role_id INT,
    CONSTRAINT fk_account_role FOREIGN KEY (role_id) REFERENCES role(id)
);

-- Bảng admin_profile (1:1 với account)
CREATE TABLE admin_profile (
    id UUID PRIMARY KEY,
    employee_code VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    full_name VARCHAR(100) NOT NULL,
    CONSTRAINT fk_admin_account FOREIGN KEY (id) REFERENCES account(id)
);

-- Bảng user_profile (1:1 với account)
CREATE TABLE user_profile (
    id UUID PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_user_account FOREIGN KEY (id) REFERENCES account(id)
);

-- Bảng worker_profile (1:1 với account)
CREATE TABLE worker_profile (
    id UUID PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    professional_certificate_url VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    tier_type VARCHAR(20) NOT NULL DEFAULT 'FREE',
    tier_expired_at TIMESTAMP,
    avg_rating DOUBLE PRECISION DEFAULT 0.0,
    CONSTRAINT fk_worker_account FOREIGN KEY (id) REFERENCES account(id)
);

-- Bảng wallets
CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    balance NUMERIC(19, 4) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    version INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Bảng transaction_history
CREATE TABLE transaction_history (
    id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    vnp_txn_ref VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(19, 4) NOT NULL,
    vnp_order_info VARCHAR(255) NOT NULL,
    vnp_order_type VARCHAR(100),
    vnp_ip_addr VARCHAR(45),
    vnp_create_date VARCHAR(14),
    vnp_expire_date VARCHAR(14),
    vnp_transaction_no VARCHAR(50),
    vnp_bank_code VARCHAR(20),
    vnp_bank_tran_no VARCHAR(50),
    vnp_card_type VARCHAR(20),
    vnp_pay_date VARCHAR(14),
    vnp_response_code VARCHAR(5),
    status VARCHAR(20) NOT NULL,
    balance_before NUMERIC(19, 4),
    balance_after NUMERIC(19, 4),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT fk_tx_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Tạo Index cho transaction_history
CREATE INDEX idx_vnp_txn_ref ON transaction_history(vnp_txn_ref);
CREATE INDEX idx_vnp_trans_no ON transaction_history(vnp_transaction_no);
