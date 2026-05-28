**Áp dụng Voucher khi tạo/hoàn tất Booking**

Customer chọn voucher (tùy chọn) khi tạo booking

         ↓

Backend (VoucherService / VoucherAvailabilityHelper) kiểm tra:
- voucher tồn tại và chưa hết hạn
- `isUsed` / `maxUses` chưa vượt quá

         ↓

Nếu hợp lệ → tính discountAmount theo discountType (FIXED_AMOUNT hoặc PERCENT), cập nhật finalAmount

         ↓

Khi booking hoàn tất → tạo `VoucherUsage` (ghi lịch sử, giảm số lượt nếu cần)