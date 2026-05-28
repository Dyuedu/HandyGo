**Tạo bài đăng công việc (Customer tạo JobPost)

Khách hàng truy cập Website

         ↓

Đăng nhập với ROLE_USER

         ↓

Mở form Tạo công việc → nhập scheduledAt (bắt buộc, phải > now)

         ↓

Gửi POST /api/v1/job-posts (server kiểm tra role và JobPostScheduleHelper.assertScheduledAtValid)

         ↓

Tạo thành công → status = OPEN + gửi thông báo tới Worker phù hợp theo jobType

         ↓

Nếu đến scheduledAt mà chưa có ứng viên → JobPostExpiryService set status = CANCELLED
