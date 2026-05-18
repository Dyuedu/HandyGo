/speckit.constitution
# PROJECT CONSTITUTION: MOCK PROJECT (SPRING BOOT & REACT-VITE)

## 1. Môi trường & Kiến trúc Hệ thống (Environment & Architecture)
- Dự án được tổ chức theo mô hình Monorepo với cấu trúc thư mục bắt buộc:
  + Backend đặt tại thư mục: `/mock-backend`
  + Frontend đặt tại thư mục: `/mock-frontend`
- Cấu trúc thư mục phải rõ ràng, tách biệt hoàn toàn giữa logic xử lý dữ liệu và giao diện người dùng.
- Hệ thống phải cấu hình sẵn sàng cho Docker (`Dockerfile` cho từng bên và `docker-compose.yml` ở thư mục gốc để dựng nhanh cả App và PostgreSQL). Nếu Dockerfile chưa có, phải được bổ sung trước khi phát hành.
- Domain phải được định nghĩa rõ trong `specs/spec.md`; nếu domain thay đổi, phải cập nhật lại toàn bộ spec/plan/tasks để đồng bộ.

## 2. Tiêu chuẩn Backend (Java Spring Boot 4.x)
- **Database:** Sử dụng PostgreSQL làm cơ sở dữ liệu chính.
- **Cấu hình:** Tất cả cấu hình hệ thống, database, JPA phải được viết tập trung trong file `src/main/resources/application.yaml` (tuyệt đối không dùng file `.properties`).
- **Mô hình:** Tuân thủ kiến trúc Layered Architecture chuẩn: `Controller` -> `Service` -> `Repository` -> `Entity`.
- **API Design:** Thiết kế theo chuẩn RESTful API, tất cả phản hồi (Response) thành công hoặc thất bại đều phải trả về định dạng JSON đồng nhất kèm HTTP Status Code phù hợp.
- **API Response Format:** Bắt buộc thống nhất schema, tối thiểu gồm: `success`, `data`, `error`, `timestamp`, `requestId`. Lỗi phải trả về `error.code`, `error.message`, `error.details` (nếu có).
- **Pagination & Filtering:** Tất cả API trả danh sách phải hỗ trợ `page`, `size`, `sort` và trả về metadata (`totalElements`, `totalPages`, `page`, `size`).
- **Định danh:** Sử dụng UUID cho Khách hàng, Thợ, Bài đăng, Đơn đặt lịch để đảm bảo bảo mật và không lộ tuần tự dữ liệu. Các bảng cấu hình/hệ thống nhỏ (Banners, Job Types) có thể dùng BIGINT Auto-increment.
- **Clean Code:** Áp dụng nguyên lý SOLID và DRY. Mỗi hàm chỉ xử lý một nhiệm vụ duy nhất (Single Responsibility). Tên hàm/biến dùng tiếng Anh theo chuẩn camelCase.
- **Migration:** Bắt buộc sử dụng công cụ migration (Flyway hoặc Liquibase). Quy ước đặt tên migration rõ ràng, không sửa migration đã chạy; thay đổi schema phải tạo migration mới.
- **Validation:** Dùng Bean Validation (`jakarta.validation`) cho input; không để null/empty rơi vào tầng service mà không kiểm tra.

## 3. Tiêu chuẩn Frontend (React-Vite)
- **Công nghệ:** Sử dụng React kết hợp với Vite (Javascript thuần ES6+, HTML5, CSS3).
- **Giao diện:** Tối giản, gọn nhẹ, tối ưu hóa CSS (ưu tiên CSS Modules hoặc Tailwind, tuyệt đối không cài các thư viện UI component quá nặng ký nếu không được yêu cầu).
- **Tính năng đặc biệt:** 
  + Tính năng kéo thả hoặc luồng bản đồ phải tận dụng Native Web APIs hoặc thư viện siêu nhẹ.
  + Tích hợp Google Maps API ở phía Client để hiển thị đường đi và vị trí của Thợ/Khách.
- **Responsive:** Giao diện phải tương thích tốt trên cả màn hình Laptop (Web) và hiển thị mượt mà dưới dạng Web-view trên các thiết bị Máy tính bảng/Mobile.
- **State & Error Handling:** Tất cả request phải có xử lý loading/error rõ ràng; không để UI rơi vào trạng thái im lặng khi lỗi.
- **Env Config:** Dùng `.env` cho cấu hình frontend và có `.env.example` mô tả biến môi trường cần thiết.

## 4. Quản lý Luồng Dữ liệu & Nghiệp vụ (Business & State Rules)
- Luồng Trạng thái Booking (`PENDING` -> `ACCEPTED`/`DECLINED` -> `PROCESSING` -> `FINISHED`) phải được kiểm tra (validate) nghiêm ngặt ở phía Backend trước khi cập nhật vào DB.
- Logic Ví điện tử (Wallet) và Đóng băng tiền (Frozen Balance) phải được xử lý bằng `@Transactional` trong Spring Boot để tránh xung đột dữ liệu (Race Conditions) khi thợ rút tiền hoặc khách xác nhận hoàn thành.
- Hệ thống thông báo (Notification) phải được thiết kế dạng Async (bất đồng bộ) để không làm nghẽn luồng xử lý chính của người dùng.
- Các nghiệp vụ liên quan thanh toán phải có idempotency key để tránh xử lý trùng khi retry.

## 5. Bảo mật & Nhật ký (Security & Logging)
- Không được hardcode các thông tin nhạy cảm (JWT Secret, Google Maps API Key, Gmail SMTP Password, Postgres Credentials) vào mã nguồn. Tất cả phải được gọi qua biến môi trường (trong `application.yaml` sử dụng `${ENV_VAR}` hoặc file `.env` phía Frontend).
- Thư mục cấu hình bí mật của AI hoặc các file credentials phát sinh phải được đưa vào `.gitignore` ở thư mục gốc để tránh rò rỉ dữ liệu.
- **Auth:** Dùng JWT Bearer chuẩn, access token ngắn hạn, refresh token dài hạn; refresh token phải được lưu/kiểm soát và có cơ chế revoke/blacklist qua Redis.
- **Logging:** Log theo JSON hoặc key-value; bắt buộc có `requestId`/`traceId`. Không log PII hoặc secrets.
- **Rate Limit:** Các endpoint nhạy cảm (login, payment) phải có rate limiting hoặc throttle.

## 6. Kiểm thử & Chất lượng (Testing & Quality)
- **Backend Tests:** Dùng JUnit 5; ít nhất có unit test cho service và integration test cho repository/api quan trọng.
- **Frontend Tests:** Nếu thêm logic phức tạp, phải có test tối thiểu cho utils hoặc hooks.
- **Lint/Format:** Tuân thủ format/lint mặc định của dự án; không commit code không format.