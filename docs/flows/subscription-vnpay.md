**Mua gói đăng ký (Subscription) qua VNPAY**

Người dùng chọn gói → nhấn "Mua"

         ↓

Client POST /api/v1/subscriptions/subscribe (tạo order, state = PENDING)

         ↓

Backend tạo `paymentUrl` VNPAY → client chuyển hướng người dùng đến VNPAY

         ↓

Người dùng thanh toán trên VNPAY → VNPAY callback về /api/v1/payment/vnpay-callback?params

         ↓

Backend xác thực chữ ký bằng VNPayUtil; nếu hợp lệ và response code = '00' → mark order = COMPLETED và kích hoạt gói cho user

         ↓

Nếu thất bại → mark order = FAILED
