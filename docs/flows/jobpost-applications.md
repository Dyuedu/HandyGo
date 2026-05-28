**Ứng tuyển và Quản lý Ứng viên (Worker apply / Customer manage)

Worker xem chi tiết công việc

         ↓

Worker gửi POST /api/v1/job-posts/{id}/applications (unique per worker/job)

         ↓

Ứng dụng lưu status = PENDING

         ↓

Customer gọi GET /api/v1/job-posts/{id}/applications → xem danh sách

         ↓

Customer PATCH .../applications/{appId}/accept → backend:
- set application -> ACCEPTED
- set jobPost -> ASSIGNED, gán assigned_worker_id
- tạo Booking (PENDING) từ JobPost
- các ứng dụng PENDING khác -> REJECTED

         ↓

Customer PATCH .../applications/{appId}/reject -> set REJECTED
