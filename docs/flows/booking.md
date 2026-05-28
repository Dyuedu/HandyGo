**Quy trình tạo Booking (từ JobPost)**

Customer chấp nhận ứng viên → tạo Booking (PENDING)

         ↓

Worker nhận được booking → có thể acceptBooking (→ ACCEPTED) hoặc declineBooking (→ DECLINED)

         ↓

Worker startProcessing → PROCESSING

         ↓

Worker markCompleted (gửi totalAmount) → COMPLETED (tính finalAmount, áp voucher nếu có)

         ↓

Customer confirmCompletion → CONFIRMED (kết thúc luồng)

Chú ý: Customer chỉ có thể hủy booking khi còn PENDING (theo quy định cutoff).