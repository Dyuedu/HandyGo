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
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
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

-- Bảng worker_locations (1:1 với worker_profile, lưu vị trí GPS thời gian thực)
CREATE TABLE worker_locations (
    worker_id UUID PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    last_update TIMESTAMP NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_worker_location_profile FOREIGN KEY (worker_id) REFERENCES worker_profile(id)
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

-- ============================================================
-- Booking & voucher module (HandyGo — Tuan Anh)
-- ============================================================

-- Bảng vouchers (catalog)
CREATE TABLE vouchers (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    value NUMERIC(19, 4) NOT NULL,
    discount_type VARCHAR(30) DEFAULT 'FIXED_AMOUNT',
    discount_percent NUMERIC(5, 2),
    max_discount_amount NUMERIC(19, 4),
    expiry_date TIMESTAMP,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    max_uses INTEGER
);

-- Voucher demo: giảm 30.000 VND, tối đa 20 lượt dùng
INSERT INTO vouchers (code, value, discount_type, is_used, max_uses)
VALUES ('GIAM30K', 30000, 'FIXED_AMOUNT', FALSE, 20)
ON CONFLICT (code) DO NOTHING;

-- Bảng bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    worker_id UUID NOT NULL,
    service_code VARCHAR(100),
    description TEXT,
    address TEXT,
    status VARCHAR(40) NOT NULL,
    total_amount NUMERIC(19, 4),
    discount_amount NUMERIC(19, 4) NOT NULL DEFAULT 0,
    final_amount NUMERIC(19, 4),
    booking_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES user_profile(id),
    CONSTRAINT fk_booking_worker FOREIGN KEY (worker_id) REFERENCES worker_profile(id),
    CONSTRAINT chk_booking_status CHECK (status IN (
        'PENDING',
        'ACCEPTED',
        'PROCESSING',
        'WAITING_CUSTOMER_CONFIRMATION',
        'FINISHED',
        'DECLINED',
        'CANCELLED'
    ))
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_worker ON bookings(worker_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Bảng booking_status_history (audit)
CREATE TABLE booking_status_history (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL,
    from_status VARCHAR(40),
    to_status VARCHAR(40) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    CONSTRAINT fk_bsh_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_bsh_booking_changed ON booking_status_history(booking_id, changed_at);

-- Bảng voucher_usage (per-booking voucher state: PENDING / REDEEMED)
CREATE TABLE voucher_usage (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE,
    voucher_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    applied_discount_amount NUMERIC(19, 4) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    redeemed_at TIMESTAMP,
    CONSTRAINT fk_vu_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_vu_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
    CONSTRAINT chk_vu_status CHECK (status IN ('PENDING', 'REDEEMED'))
);
