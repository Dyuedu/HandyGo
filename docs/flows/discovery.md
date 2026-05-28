**Duyệt công việc (Discovery — Worker / Public)

Mở trang Duyệt công việc / Bản đồ

         ↓

Gọi API: GET /api/v1/job-posts/discover/open (hoặc lọc theo jobType)

         ↓

Hiển thị các job có `status = OPEN` và `scheduledAt > now`

         ↓

Người dùng nhấp vào job → gọi GET /api/v1/job-posts/{id} để xem chi tiết
