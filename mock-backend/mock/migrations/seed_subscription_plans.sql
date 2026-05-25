-- Subscription Plans Seed Data
-- This file contains the initial subscription plans for the system
-- Run this after the database migration to populate subscription plans

INSERT INTO subscriptions (plan_name, price, duration_days, status, created_at) VALUES
('FREE', 0, 1, 'ACTIVE', NOW()),
('BASIC', 49000, 30, 'ACTIVE', NOW()),
('PRO', 199000, 30, 'ACTIVE', NOW());

-- Optional: Create additional plans
-- INSERT INTO subscriptions (plan_name, price, duration_days, status, created_at) VALUES
-- ('BASIC_3MONTH', 120000, 90, 'ACTIVE', NOW()),
-- ('PRO_3MONTH', 500000, 90, 'ACTIVE', NOW()),
-- ('ANNUAL', 1200000, 365, 'ACTIVE', NOW());
