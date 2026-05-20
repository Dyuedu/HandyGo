-- Chạy trên DB đã tồn tại (Supabase/local) nếu bảng vouchers chưa có max_uses
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS max_uses INTEGER;

INSERT INTO vouchers (code, value, discount_type, is_used, max_uses)
VALUES ('GIAM30K', 30000, 'FIXED_AMOUNT', FALSE, 20)
ON CONFLICT (code) DO NOTHING;
