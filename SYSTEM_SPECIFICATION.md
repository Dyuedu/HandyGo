# HANDYGO - TÀI LIỆU ĐẶC TẢ HỆ THỐNG

## 1. GIỚI THIỆU

### 1.1 Mục đích tài liệu
Tài liệu này mô tả chi tiết các yêu cầu chức năng và phi chức năng của hệ thống HandyGo - một nền tảng kết nối người dùng (Customer) với những người cung cấp dịch vụ (Worker/Technician) để tìm kiếm, đặt và thanh toán các dịch vụ. Tài liệu được sử dụng làm cơ sở cho việc phát triển, kiểm thử và triển khai hệ thống.

### 1.2 Phạm vi dự án
Hệ thống HandyGo bao gồm:

**Backend**: Hệ thống quản lý và API server được xây dựng bằng Spring Boot 4.0.2
**Frontend**: Giao diện người dùng được xây dựng bằng React 19 + Vite 8
**Database**: Hệ thống quản lý cơ sở dữ liệu PostgreSQL
**Cache & Session**: Redis để quản lý refresh tokens và cache dữ liệu
**Tích hợp bên ngoài**:
- Thanh toán VNPay
- OAuth2 (Google)
- Cloudinary (Lưu trữ hình ảnh/file)
- Email (Gmail SMTP)
- Google Maps API (Hiển thị vị trí)
- WebSocket STOMP (Real-time notifications)

### 1.3 Mục tiêu hệ thống
1. Xây dựng một nền tảng kết nối giữa khách hàng và các nhân viên dịch vụ
2. Cho phép khách hàng dễ dàng tìm kiếm, tạo và đặt các dịch vụ cần thiết
3. Cho phép công nhân/thợ quản lý hồ sơ, nhận đơn và quản lý tiền kiếm được
4. Cung cấp hệ thống thanh toán an toàn và tiện lợi qua VNPay
5. Hỗ trợ giao tiếp real-time giữa khách hàng và công nhân
6. Hỗ trợ hệ thống đánh giá và xếp hạng dựa trên chất lượng dịch vụ
7. Quản lý ví điện tử để người lao động rút tiền kiếm được

### 1.4 Công nghệ sử dụng

**Backend**
- Framework: Spring Boot 4.0.2
- Ngôn ngữ: Java 17
- Database: PostgreSQL
- Cache: Redis
- ORM: Spring Data JPA / Hibernate
- Security: Spring Security + JWT (Bearer Token)
- Real-time: WebSocket (STOMP)
- API Documentation: SpringDoc OpenAPI (Swagger)
- Email: Spring Mail (Gmail SMTP)
- Migration: Flyway
- Build Tool: Maven

**Frontend**
- Framework: React 19.1.1
- Ngôn ngữ: JavaScript ES6+
- Build Tool: Vite 8.0.0
- Routing: React Router DOM 6
- HTTP Client: Axios
- Styling: CSS3 + Tailwind CSS
- State Management: React Context API
- Real-time: WebSocket (STOMP.js, SockJS)
- Map: Google Maps API
- Notifications: React Toastify

**Tích hợp bên ngoài**
- Payment: VNPay
- Image Storage: Cloudinary
- Authentication: Google OAuth2
- Communication: Gmail SMTP
- Location: Google Maps API

---

## 2. TỔNG QUAN HỆ THỐNG

### 2.1 Mô tả tổng quát
HandyGo là một nền tảng dịch vụ trực tuyến toàn diện, được thiết kế để kết nối khách hàng cần sử dụng dịch vụ với những người cung cấp dịch vụ chuyên nghiệp. Hệ thống được xây dựng theo kiến trúc client-server với backend RESTful API và frontend SPA (Single Page Application).

**Kiến trúc hệ thống**:
- **Client Layer**: React SPA với routing và state management dựa trên Context API
- **API Layer**: Spring Boot REST API với JWT Bearer token authentication
- **Business Layer**: Service layer xử lý logic nghiệp vụ chính
- **Data Layer**: JPA/Hibernate với PostgreSQL database
- **Cache Layer**: Redis cho refresh token management và caching
- **Integration Layer**: Tích hợp với các dịch vụ bên ngoài (VNPay, Google, Cloudinary)
- **Real-time Layer**: WebSocket STOMP cho notifications và chat real-time

**Các module chính**:
1. **Authentication & Authorization**: Đăng ký, đăng nhập, OAuth2 Google, JWT token management, role-based access control
2. **User Profile Management**: Quản lý hồ sơ khách hàng, thông tin liên hệ, địa chỉ
3. **Worker Profile Management**: Quản lý hồ sơ công nhân, chứng chỉ, xác thực, tiers subscription
4. **Job Post Management**: Tạo, quản lý, tìm kiếm các bài đăng công việc
5. **Booking System**: Đặt lịch dịch vụ, quản lý trạng thái, lịch sử booking
6. **Matching System**: Gợi ý công nhân phù hợp dựa trên loại công việc và vị trí
7. **Payment & Wallet**: Ví điện tử, top-up tiền, thanh toán VNPay
8. **Subscription & Tiers**: Gói dịch vụ cho công nhân (Free, Basic, Pro)
9. **Review & Rating**: Đánh giá chất lượng dịch vụ, bình luận
10. **Chat & Messaging**: Chat real-time giữa khách hàng và công nhân
11. **Notification System**: Thông báo real-time qua WebSocket
12. **Dashboard & Analytics**: Dashboard cho quản trị viên với thống kê

### 2.2 Luồng người dùng tổng quát

**Luồng khách hàng (Customer Flow)**
```
Truy cập website → Xem trang chủ, các bài đăng công việc nổi bật
                 ↓
Duyệt công việc → Tìm kiếm, lọc theo loại công việc, xem chi tiết
                 ↓
Đăng ký/Đăng nhập → Tạo tài khoản hoặc đăng nhập (email/Google OAuth)
                 ↓
Tạo bài đăng công việc → Nhập tiêu đề, mô tả, loại công việc, vị trí
                 ↓
Quản lý bài đăng → Xem, chỉnh sửa, xóa bài đăng của mình
                 ↓
Nhận đơn từ công nhân → Xem danh sách công nhân quan tâm
                 ↓
Xác nhận booking → Chấp nhận công nhân, bắt đầu booking
                 ↓
Thanh toán → Thanh toán tiền công dịch vụ qua VNPay
           ↓
Theo dõi dịch vụ → Xem trạng thái, chat với công nhân
                 ↓
Hoàn thành → Xác nhận hoàn tất, đánh giá công nhân
```

**Luồng công nhân (Worker/Technician Flow)**
```
Truy cập website → Xem trang chủ, các công việc sắp tới
                 ↓
Đăng ký/Đăng nhập → Tạo tài khoản công nhân hoặc đăng nhập
                 ↓
Hoàn thành hồ sơ → Upload chứng chỉ, xác thực tài khoản
                 ↓
Chọn gói dịch vụ → Chọn gói Free/Basic/Pro để mở rộng chức năng
                 ↓
Duyệt công việc → Tìm kiếm, lọc công việc phù hợp
                 ↓
Gửi đơn → Nhận công việc, gửi giá, chờ khách hàng xác nhận
        ↓
Bắt đầu dịch vụ → Cập nhật trạng thái thành "Processing"
               ↓
Hoàn thành công việc → Xác nhận hoàn tất
                    ↓
Nhận tiền → Kiếm được tiền, có thể rút vào ví
         ↓
Quản lý ví → Top-up, rút tiền, xem lịch sử giao dịch
```

---

## 3. CÁC NHÓM NGƯỜI DÙNG VÀ CHỨC NĂNG

### 3.1 Bảng Use Case tổng hợp

| STT | Use Case | Nhóm người dùng | Mô tả |
|-----|----------|-----------------|-------|
| 1 | Đăng ký tài khoản | Khách hàng, Công nhân | Tạo tài khoản mới với email và mật khẩu |
| 2 | Đăng nhập | Khách hàng, Công nhân | Xác thực người dùng bằng email/mật khẩu |
| 3 | Đăng nhập Google | Khách hàng, Công nhân | Đăng nhập bằng OAuth2 Google |
| 4 | Quên mật khẩu | Khách hàng, Công nhân | Khôi phục mật khẩu qua email |
| 5 | Cập nhật hồ sơ | Khách hàng, Công nhân | Cập nhật thông tin cá nhân |
| 6 | Upload chứng chỉ | Công nhân | Upload chứng chỉ/giấy phép (Cloudinary) |
| 7 | Tạo bài đăng công việc | Khách hàng | Tạo yêu cầu dịch vụ mới |
| 8 | Duyệt công việc | Khách hàng, Công nhân | Tìm kiếm, lọc công việc |
| 9 | Xem chi tiết công việc | Khách hàng, Công nhân | Xem thông tin chi tiết bài đăng |
| 10 | Gửi đơn công việc | Công nhân | Quan tâm và gửi đơn cho công việc |
| 11 | Xác nhận booking | Khách hàng | Chấp nhận công nhân được chọn |
| 12 | Cập nhật trạng thái booking | Công nhân | Cập nhật trạng thái công việc |
| 13 | Thanh toán | Khách hàng | Thanh toán tiền công qua VNPay |
| 14 | Theo dõi booking | Khách hàng, Công nhân | Xem trạng thái công việc |
| 15 | Đánh giá công nhân | Khách hàng | Đánh giá chất lượng dịch vụ |
| 16 | Quản lý ví điện tử | Công nhân | Top-up, rút tiền, xem lịch sử |
| 17 | Chọn gói subscription | Công nhân | Nâng cấp gói dịch vụ (Free/Basic/Pro) |
| 18 | Chat real-time | Khách hàng, Công nhân | Trao đổi thông tin qua chat |
| 19 | Nhận thông báo | Khách hàng, Công nhân | Nhận thông báo real-time |
| 20 | Quản lý booking | Khách hàng | Xem lịch sử booking của mình |

### 3.2 Nhóm User/Khách hàng (Customer)

**Quyền truy cập**:
- Tạo, xem, chỉnh sửa, xóa bài đăng công việc của mình
- Duyệt danh sách công nhân đã gửi đơn
- Xem hồ sơ công nhân, đánh giá, xếp hạng
- Xác nhận booking với công nhân
- Thanh toán tiền công qua VNPay
- Theo dõi trạng thái công việc
- Đánh giá và bình luận về dịch vụ
- Chat với công nhân
- Nhận thông báo real-time
- Quản lý lịch sử booking

**Chức năng chi tiết**:
- Đăng ký/Đăng nhập (email, Google OAuth2)
- Quên mật khẩu và đặt lại mật khẩu
- Cập nhật thông tin cá nhân (họ tên, số điện thoại, địa chỉ)
- Tạo bài đăng công việc (tiêu đề, mô tả, loại công việc, vị trí)
- Tìm kiếm và lọc công việc
- Xem danh sách công nhân quan tâm
- Xem hồ sơ chi tiết công nhân
- Xác nhận booking với công nhân được chọn
- Thanh toán tiền công qua VNPay
- Cập nhật trạng thái booking (xác nhận hoàn tất)
- Chat real-time với công nhân
- Đánh giá công nhân (1-5 sao, bình luận)
- Xem lịch sử booking, giao dịch

### 3.3 Nhóm Worker/Công nhân (Technician)

**Quyền truy cập**:
    - Duyệt danh sách công việc sắp tới
    - Gửi đơn cho các công việc
    - Quản lý hồ sơ, upload chứng chỉ
    - Xác thực tài khoản
    - Quản lý ví điện tử
    - Top-up tiền, rút tiền
    - Chọn gói subscription (upgrade tier)
    - Cập nhật trạng thái công việc
    - Chat với khách hàng
    - Nhận thông báo real-time
    - Xem lịch sử booking, đánh giá

**Chức năng chi tiết**:
- Đăng ký/Đăng nhập (email, Google OAuth2)
- Hoàn thành hồ sơ công nhân:
  - Upload chứng chỉ/giấy phép (Cloudinary)
  - Chọn loại công việc chuyên về
  - Đặt mô tả về kỹ năng
- Xác thực tài khoản (email, phone verification)
- Duyệt công việc sắp tới:
  - Tìm kiếm theo loại công việc
  - Lọc theo vị trí gần nhất
  - Xem chi tiết công việc
- Gửi đơn cho công việc (quoted price)
- Quản lý ví điện tử:
  - Top-up tiền vào ví (VNPay)
  - Xem số dư ví
  - Rút tiền (chuyển ngân hàng)
  - Xem lịch sử giao dịch
- Chọn gói subscription:
  - Free tier (tính năng cơ bản)
  - Basic tier (nhiều đặc quyền)
  - Pro tier (đặc quyền tối đa)
- Cập nhật trạng thái booking:
  - Bắt đầu công việc (ACCEPTED)
  - Đang thực hiện (PROCESSING)
  - Xác nhận hoàn tất (FINISHED)
- Chat real-time với khách hàng
- Xem lịch sử booking
- Quản lý đánh giá từ khách hàng

### 3.4 Nhóm Admin/Quản trị

**Quyền truy cập** (nếu có trong tương lai):
- Toàn quyền quản lý hệ thống
- Quản lý người dùng (block, unlock)
- Xem thống kê hệ thống
- Quản lý loại công việc
- Kiểm duyệt chứng chỉ công nhân
- Quản lý tranh chấp/khiếu nại

---

## 4. QUY TẮC NGHIỆP VỤ (BUSINESS RULE)

### 4.1 Quản lý bài đăng công việc
- Bài đăng phải thuộc về một khách hàng duy nhất
- Bài đăng phải có ít nhất tiêu đề, mô tả, loại công việc
- Chỉ chủ bài đăng có thể chỉnh sửa hoặc xóa
- Bài đăng có thể ở trạng thái: OPEN, IN_PROGRESS, FINISHED, CANCELLED
- Bài đăng ở trạng thái OPEN có thể nhận đơn từ công nhân

### 4.2 Quản lý booking
- Booking chỉ được tạo khi công nhân gửi đơn cho bài đăng công việc
- Booking không thể được tạo nếu công nhân chưa xác thực tài khoản
- Mỗi công nhân chỉ có thể gửi một đơn cho một bài đăng
- Khách hàng phải chọn một công nhân để xác nhận booking
- Trạng thái booking: PENDING → ACCEPTED → PROCESSING → WAITING_CUSTOMER_CONFIRMATION → FINISHED
- Không được phép chuyển trạng thái ngược lại

### 4.3 Quản lý thanh toán
- Thanh toán chỉ có thể thực hiện qua VNPay
- Thanh toán phải được xác nhận trước khi booking chuyển sang PROCESSING
- Nếu thanh toán thất bại, booking vẫn ở trạng thái PENDING
- Tiền từ thanh toán sẽ được cộng vào ví của công nhân

### 4.4 Quản lý ví điện tử
- Công nhân có một ví duy nhất
- Ví chứa tiền từ các booking hoàn thành
- Công nhân có thể top-up tiền vào ví (VNPay)
- Công nhân có thể rút tiền từ ví (chuyển ngân hàng)
- Rút tiền phải có số tài khoản ngân hàng và tên chủ tài khoản

### 4.5 Quản lý subscription/Tiers
- Công nhân có thể chọn một gói dịch vụ: Free, Basic, hoặc Pro
- Mỗi gói có thời hạn nhất định (ví dụ: 30 ngày)
- Khi hết hạn, công nhân sẽ trở về tier Free
- Gói Pro cung cấp nhiều đặc quyền hơn (ưu tiên hiển thị, v.v.)

### 4.6 Quản lý đánh giá
- Chỉ khách hàng có thể đánh giá công nhân
- Đánh giá từ 1-5 sao
- Có thể bình luận kèm theo đánh giá
- Chỉ được đánh giá sau khi booking hoàn thành

### 4.7 Xác thực và bảo mật
- Mật khẩu phải có độ dài tối thiểu 8 ký tự
- Mật khẩu phải chứa ít nhất 1 chữ in hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
- **Email phải được xác thực bằng mã 6 số khi đăng ký (bắt buộc)**
- **Mã xác thực email có thời hạn 15 phút**
- **User được phép yêu cầu gửi lại mã 3 lần/giờ**
- **Sau 3 lần nhập sai, email bị lock trong 1 giờ**
- **Sử dụng Thymeleaf template engine để gửi email đẹp**
- JWT token có thời hạn (access token: 15 phút, refresh token: 7 ngày)
- Refresh token được lưu trữ và quản lý bởi Redis
- Cần kiểm tra lockout sau 5 lần đăng nhập sai trong 10 phút

### 4.8 Tích hợp bên ngoài
- VNPay: Tích hợp thanh toán bằng URL redirect, callback verification
- Google OAuth2: Lấy email, tên, ảnh đại diện
- Cloudinary: Lưu trữ chứng chỉ, ảnh hồ sơ
- Google Maps: Hiển thị vị trí công việc

---

## 5. YÊU CẦU CHỨC NĂNG CHI TIẾT

### 5.1 Authentication & Profile Management

#### 5.1.1 Đăng ký tài khoản (Account Registration)
**Mô tả**: Người dùng có thể tạo tài khoản mới bằng email và mật khẩu hoặc Google OAuth, với yêu cầu xác thực email bắt buộc.

**Yêu cầu**:
- Form đăng ký gồm: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu, Số điện thoại, Vai trò (Customer/Worker)
- Email phải hợp lệ và chưa được sử dụng
- Mật khẩu phải đáp ứng yêu cầu bảo mật (min 8 ký tự, chứa upper/lower/number/special)
- Số điện thoại phải là số Việt Nam hợp lệ
- Tài khoản ở trạng thái "inactive" cho đến khi xác thực email thành công
- Nếu là Worker, tài khoản ở trạng thái "unverified" cho đến khi xác thực chứng chỉ
- Gửi email xác thực chứa mã 6 số sau khi đăng ký
- Mã xác thực có thời hạn 15 phút
- User có thể yêu cầu gửi lại mã xác thực

**Email Template (Thymeleaf)**:
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; color: #2c3e50; margin-bottom: 30px; }
        .code-box { background-color: #ecf0f1; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px; }
        .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Xác thực tài khoản HandyGo</h1>
        </div>
        <p>Chào <strong th:text="${fullName}">User</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký HandyGo. Để kích hoạt tài khoản, vui lòng nhập mã xác thực bên dưới:</p>
        <div class="code-box">
            <div class="code" th:text="${verificationCode}">123456</div>
        </div>
        <p>Mã xác thực này có hiệu lực trong <strong>15 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
        <div class="footer">
            <p>© 2026 HandyGo. All rights reserved.</p>
            <p>Địa chỉ: HandyGo, Vietnam</p>
        </div>
    </div>
</body>
</html>
```

**Luồng xử lý**:
1. Người dùng điền form đăng ký
2. Hệ thống validate dữ liệu
3. Kiểm tra email/số điện thoại chưa tồn tại
4. Mã hóa mật khẩu bằng BCrypt
5. Tạo tài khoản và profile với status = "inactive"
6. Tạo mã xác thực 6 số ngẫu nhiên
7. Lưu mã vào database với TTL 15 phút
8. Gửi email xác thực sử dụng Thymeleaf template
9. Trả về response yêu cầu user xác thực email
10. User nhập mã xác thực
11. Hệ thống verify mã
12. Nếu đúng: cập nhật status = "active", xóa mã xác thực
13. Nếu sai: trả về error, cho phép retry
14. User có thể yêu cầu gửi lại mã (tối đa 3 lần/giờ)

#### 5.1.2 Xác thực Email (Email Verification)
**Mô tả**: Người dùng xác thực email bằng mã 6 số được gửi qua email.

**Yêu cầu**:
- Form xác thực gồm: Email, Mã xác thực (6 số)
- Mã xác thực có thời hạn 15 phút
- Cho phép user yêu cầu gửi lại mã (tối đa 3 lần/giờ)
- Khi xác thực thành công, kích hoạt tài khoản
- Gửi email chào mừng sau khi xác thực thành công

**Email Welcome Template (Thymeleaf)**:
```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
        .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Chào mừng bạn đến với HandyGo!</h1>
        </div>
        <p>Xin chào <strong th:text="${fullName}">User</strong>,</p>
        <p>Tài khoản của bạn đã được xác thực thành công. Bây giờ bạn có thể sử dụng đầy đủ các tính năng của HandyGo.</p>
        <center>
            <a th:href="${appUrl}" class="button">Bắt đầu sử dụng</a>
        </center>
        <div th:if="${userRole == 'WORKER'}">
            <h3>👷 Bước tiếp theo dành cho công nhân:</h3>
            <ul>
                <li>Hoàn thành hồ sơ công nhân</li>
                <li>Upload chứng chỉ/giấy phép</li>
                <li>Chọn loại công việc chuyên về</li>
                <li>Bắt đầu tìm kiếm công việc</li>
            </ul>
        </div>
        <div th:if="${userRole == 'USER'}">
            <h3>👤 Bước tiếp theo dành cho khách hàng:</h3>
            <ul>
                <li>Tìm kiếm công nhân phù hợp</li>
                <li>Tạo bài đăng công việc</li>
                <li>Đặt lịch dịch vụ</li>
                <li>Thanh toán an toàn qua VNPay</li>
            </ul>
        </div>
        <div class="footer">
            <p>© 2026 HandyGo. All rights reserved.</p>
            <p>Nếu bạn có câu hỏi, vui lòng liên hệ support@handygo.vn</p>
        </div>
    </div>
</body>
</html>
```

**Luồng xử lý**:
1. User nhập email và mã xác thực
2. Hệ thống validate dữ liệu
3. Kiểm tra mã xác thực có tồn tại
4. Kiểm tra mã có hết hạn
5. So sánh mã nhập với mã lưu
6. Nếu đúng: cập nhật status = "active", xóa mã, gửi email chào mừng
7. Nếu sai: return error, record attempt
8. Sau 3 lần sai: lock email trong 1 giờ

#### 5.1.3 Đăng nhập (Login)
**Mô tả**: Người dùng đăng nhập bằng email/mật khẩu hoặc Google OAuth2.

**Yêu cầu**:
- Đăng nhập bằng email/mật khẩu
- Đăng nhập bằng Google OAuth2
- Tài khoản phải tồn tại và active
- Sau khi đăng nhập thành công, hệ thống trả về JWT access token và refresh token
- Refresh token được lưu trữ trong Redis với TTL 7 ngày
- Hỗ trợ rate limiting: Lockout sau 5 lần đăng nhập sai trong 10 phút

**Luồng xử lý**:
1. Người dùng nhập email/mật khẩu hoặc chọn Google OAuth
2. Hệ thống xác thực thông tin
3. Kiểm tra lockout status
4. Kiểm tra trạng thái tài khoản (active)
5. Tạo JWT access token và refresh token
6. Lưu refresh token vào Redis
7. Trả về tokens và user info

#### 5.1.4 Quên mật khẩu (Forgot Password)
**Mô tả**: Người dùng có thể khôi phục mật khẩu khi quên.

**Yêu cầu**:
- Nhập email để yêu cầu reset mật khẩu
- Gửi email chứa link reset mật khẩu
- Link có thời hạn (1 giờ)
- Cho phép đặt mật khẩu mới

#### 5.1.5 Quản lý tài khoản (Account Management)
**Mô tả**: Người dùng quản lý thông tin cá nhân.

**Yêu cầu**:
- Xem thông tin tài khoản
- Cập nhật họ tên, số điện thoại
- Đổi mật khẩu
- Cập nhật ảnh đại diện

#### 5.1.6 Quản lý hồ sơ công nhân (Worker Profile)
**Mô tả**: Công nhân hoàn thành hồ sơ và xác thực tài khoản.

**Yêu cầu**:
- Upload chứng chỉ/giấy phép (Cloudinary)
- Chọn loại công việc chuyên về
- Đặt mô tả về kỹ năng
- Xác thực email và số điện thoại
- Hiển thị trạng thái xác thực

### 5.2 Job Post Management

#### 5.2.1 Tạo bài đăng công việc (Create Job Post)
**Mô tả**: Khách hàng tạo bài đăng công việc để tìm kiếm công nhân.

**Yêu cầu**:
- Form bao gồm: Tiêu đề, Mô tả, Loại công việc, Địa chỉ chi tiết, Tọa độ (latitude, longitude)
- Tiêu đề phải dài ít nhất 10 ký tự
- Mô tả phải dài ít nhất 20 ký tự
- Loại công việc phải là một trong các loại định nghĩa sẵn (DIEN, NUOC, HARM, CLEAN, v.v.)
- Địa chỉ phải bao gồm số nhà, đường phố
- Bài đăng ở trạng thái OPEN khi mới tạo
- Chỉ chủ bài đăng có thể chỉnh sửa

#### 5.2.2 Duyệt bài đăng công việc (Browse Job Posts)
**Mô tả**: Người dùng duyệt danh sách bài đăng công việc.

**Yêu cầu**:
- Hiển thị danh sách bài đăng ở trạng thái OPEN
- Hỗ trợ phân trang
- Lọc theo loại công việc
- Lọc theo vị trí (khoảng cách gần nhất)
- Tìm kiếm theo tiêu đề, mô tả
- Sắp xếp theo thời gian tạo, khoảng cách
- Hiển thị thông tin: tiêu đề, mô tả ngắn, loại công việc, vị trí, số lượng đơn

#### 5.2.3 Xem chi tiết bài đăng (Job Post Detail)
**Mô tả**: Người dùng xem chi tiết bài đăng.

**Yêu cầu**:
- Hiển thị đầy đủ thông tin bài đăng
- Hiển thị vị trí trên bản đồ Google Maps
- Hiển thị danh sách công nhân đã gửi đơn (chỉ khách hàng)
- Hiển thị hồ sơ công nhân, đánh giá, xếp hạng
- Cho phép gửi đơn hoặc xác nhận booking (tùy theo vai trò)

#### 5.2.4 Quản lý bài đăng (Manage Job Posts)
**Mô tả**: Khách hàng quản lý bài đăng của mình.

**Yêu cầu**:
- Xem danh sách bài đăng của mình
- Chỉnh sửa bài đăng (chỉ khi ở trạng thái OPEN)
- Xóa bài đăng
- Xem danh sách công nhân quan tâm
- Xem lịch sử booking liên quan đến bài đăng

### 5.3 Booking Management

#### 5.3.1 Gửi đơn công việc (Submit Offer)
**Mô tả**: Công nhân gửi đơn quan tâm cho bài đăng công việc.

**Yêu cầu**:
- Công nhân xem bài đăng công việc
- Nhập giá dịch vụ
- Gửi đơn
- Khách hàng nhận thông báo về đơn mới

#### 5.3.2 Xác nhận booking (Confirm Booking)
**Mô tả**: Khách hàng chọn công nhân và xác nhận booking.

**Yêu cầu**:
- Chọn một công nhân từ danh sách đơn
- Xác nhận giá dịch vụ
- Tạo booking với trạng thái PENDING
- Gửi thông báo cho công nhân được chọn
- Gửi thông báo từ chối cho các công nhân khác

#### 5.3.3 Quản lý trạng thái booking (Manage Booking Status)
**Mô tả**: Quản lý trạng thái công việc trong suốt quá trình.

**Yêu cầu**:
- Trạng thái flow: PENDING → ACCEPTED → PROCESSING → WAITING_CUSTOMER_CONFIRMATION → FINISHED
- Công nhân có thể chuyển sang ACCEPTED, PROCESSING
- Khách hàng có thể xác nhận FINISHED
- Mỗi trạng thái có thể được lưu lịch sử với timestamp
- Gửi thông báo khi trạng thái thay đổi

#### 5.3.4 Xem chi tiết booking (Booking Detail)
**Mô tả**: Xem thông tin chi tiết booking.

**Yêu cầu**:
- Hiển thị thông tin khách hàng (công nhân)
- Hiển thị thông tin công nhân (khách hàng)
- Hiển thị chi tiết bài đăng
- Hiển thị giá, tổng tiền, trạng thái thanh toán
- Hiển thị lịch sử trạng thái
- Cho phép chat với bên kia

### 5.4 Payment & Wallet Management

#### 5.4.1 Thanh toán booking (Payment)
**Mô tả**: Khách hàng thanh toán tiền công qua VNPay.

**Yêu cầu**:
- Tích hợp VNPay gateway
- Tạo URL thanh toán VNPay
- Xử lý callback từ VNPay
- Cập nhật trạng thái thanh toán
- Chuyển tiền vào ví công nhân khi thanh toán thành công

#### 5.4.2 Quản lý ví điện tử (Wallet Management)
**Mô tả**: Công nhân quản lý ví điện tử.

**Yêu cầu**:
- Xem số dư ví
- Top-up tiền vào ví (VNPay)
- Rút tiền từ ví (chuyển ngân hàng)
- Xem lịch sử giao dịch
- Lịch sử phải bao gồm: ngày, loại giao dịch (in/out), số tiền, trạng thái

#### 5.4.3 Rút tiền (Withdrawal)
**Mô tả**: Công nhân rút tiền từ ví.

**Yêu cầu**:
- Cung cấp số tài khoản ngân hàng
- Nhập số tiền muốn rút
- Kiểm tra số dư đủ
- Tạo yêu cầu rút tiền
- Trạng thái rút: PENDING → PROCESSING → COMPLETED/FAILED

### 5.5 Subscription & Tiers

#### 5.5.1 Chọn gói subscription (Choose Subscription)
**Mô tả**: Công nhân chọn gói dịch vụ để nâng cấp.

**Yêu cầu**:
- Hiển thị 3 gói: Free (miễn phí), Basic ($), Pro ($$)
- Mỗi gói có mô tả đặc quyền
- Cho phép chuyển đổi gói
- Gói có thời hạn nhất định (ví dụ: 30 ngày)
- Khi hết hạn, công nhân trở về tier Free

#### 5.5.2 Quản lý subscription info (Subscription Info)
**Mô tả**: Xem thông tin gói dịch vụ hiện tại.

**Yêu cầu**:
- Hiển thị gói hiện tại
- Hiển thị ngày hết hạn
- Hiển thị số ngày còn lại
- Cho phép nâng cấp gói

### 5.6 Review & Rating

#### 5.6.1 Đánh giá công nhân (Rate Worker)
**Mô tả**: Khách hàng đánh giá công nhân sau khi hoàn thành dịch vụ.

**Yêu cầu**:
- Chỉ có thể đánh giá sau khi booking ở trạng thái FINISHED
- Đánh giá từ 1-5 sao
- Viết bình luận (tùy chọn)
- Có thể chỉnh sửa sau khi gửi
- Lưu lại timestamp đánh giá

#### 5.6.2 Xem đánh giá (View Ratings)
**Mô tả**: Xem đánh giá của công nhân.

**Yêu cầu**:
- Hiển thị danh sách đánh giá trên hồ sơ công nhân
- Tính điểm trung bình xếp hạng
- Hiển thị số lượng đánh giá
- Cho phép lọc theo số sao

### 5.7 Chat & Messaging

#### 5.7.1 Chat real-time (Real-time Chat)
**Mô tả**: Giao tiếp real-time giữa khách hàng và công nhân.

**Yêu cầu**:
- Sử dụng WebSocket STOMP
- Hiển thị lịch sử chat
- Hỗ trợ gửi text message
- Hiển thị trạng thái online/offline
- Hiển thị "đang gõ" khi người kia đang soạn tin

### 5.8 Notifications

#### 5.8.1 Thông báo real-time (Real-time Notifications)
**Mô tả**: Gửi thông báo real-time cho người dùng.

**Yêu cầu**:
- Thông báo khi có đơn mới (cho khách hàng)
- Thông báo khi booking được xác nhận (cho công nhân)
- Thông báo khi trạng thái booking thay đổi
- Thông báo thanh toán thành công
- Sử dụng WebSocket STOMP
- Hiển thị số lượng thông báo chưa đọc
- Đánh dấu đã đọc

---

## 6. YÊU CẦU PHI CHỨC NĂNG

### 6.1 Hiệu năng (Performance)
- Thời gian phản hồi API: < 500ms cho các request thông thường
- Thời gian tải trang: < 3 giây
- Hỗ trợ phân trang cho danh sách lớn
- Tối ưu hóa truy vấn database (indexing, query optimization)
- Caching dữ liệu ít thay đổi (loại công việc, v.v.)
- Nén dữ liệu trước khi truyền

### 6.2 Bảo mật (Security)
- Xác thực bằng JWT với access token và refresh token
- Refresh token được lưu trữ trong Redis
- Mã hóa mật khẩu bằng BCrypt
- HTTPS cho tất cả kết nối
- CORS configuration để bảo vệ API
- Input validation và sanitization
- SQL injection prevention (JPA/Hibernate)
- XSS prevention
- Rate limiting cho API endpoints nhạy cảm
- Token rotation khi refresh
- Lockout sau N lần đăng nhập sai

### 6.3 Khả năng mở rộng (Scalability)
- Kiến trúc tách biệt frontend và backend
- RESTful API dễ mở rộng
- Database có thể scale (indexing, partitioning)
- Stateless authentication (JWT)
- Session management qua Redis
- Hỗ trợ horizontal scaling

### 6.4 Khả năng sử dụng (Usability)
- Giao diện responsive (mobile, tablet, desktop)
- UI/UX thân thiện, dễ sử dụng
- Thông báo rõ ràng cho người dùng
- Loading states và error handling
- Form validation với feedback ngay lập tức
- Hỗ trợ tiếng Việt

### 6.5 Độ tin cậy (Reliability)
- Error handling và exception handling toàn diện
- Transaction management cho các thao tác quan trọng
- Logging chi tiết với requestId/traceId
- Backup database định kỳ
- Health check endpoints
- Graceful degradation khi service bên ngoài lỗi

### 6.6 Khả năng bảo trì (Maintainability)
- Code structure rõ ràng, dễ đọc
- Separation of concerns (Controller, Service, Repository)
- DTO pattern
- JavaDoc cho các method quan trọng
- API documentation (Swagger/OpenAPI)
- Semantic versioning cho API

### 6.7 Tích hợp (Integration)
- Tích hợp VNPay cho thanh toán
- Tích hợp Google OAuth2 cho authentication
- Tích hợp Cloudinary cho lưu trữ file
- Tích hợp Gmail SMTP cho email
- Tích hợp Google Maps API

### 6.8 Khả năng truy cập (Accessibility)
- Semantic HTML
- Keyboard navigation
- Alt text cho images
- Contrast ratio phù hợp
- Responsive design cho tất cả kích thước màn hình

---

## 7. MÔ HÌNH DỮ LIỆU (DATABASE / ENTITIES)

### 7.1 Sơ đồ ERD tổng quan

**Nhóm User & Authentication**:
- `users`: Thông tin người dùng (email, password, status)
- `user_profiles`: Hồ sơ khách hàng (họ tên, số điện thoại, ảnh)
- `worker_profiles`: Hồ sơ công nhân (chứng chỉ, xác thực, tier type, tier expired)
- `email_verifications`: Xác thực email (mã 6 số, hết hạn, attempts)
- `refresh_tokens`: JWT refresh tokens (lưu trong Redis)
- `login_attempts`: Lịch sử đăng nhập sai (rate limiting)

**Nhóm Job Post**:
- `job_posts`: Bài đăng công việc (tiêu đề, mô tả, loại, vị trí, trạng thái)
- `job_types`: Loại công việc (DIEN, NUOC, HARM, CLEAN, v.v.)
- `job_post_applications`: Công nhân gửi đơn cho bài đăng

**Nhóm Booking**:
- `bookings`: Đơn đặt lịch dịch vụ (trạng thái, giá, thanh toán)
- `booking_status_history`: Lịch sử trạng thái booking

**Nhóm Payment & Wallet**:
- `wallets`: Ví điện tử công nhân (số dư, frozen amount)
- `wallet_transactions`: Lịch sử giao dịch ví (top-up, withdrawal, payment)
- `payments`: Thông tin thanh toán booking (VNPay)

**Nhóm Subscription**:
- `subscriptions`: Gói dịch vụ (Free, Basic, Pro)
- `worker_subscriptions`: Gói subscription của công nhân (tier, expired date)

**Nhóm Review & Rating**:
- `ratings`: Đánh giá công nhân (số sao, bình luận)

**Nhóm Chat & Notification**:
- `chat_messages`: Tin nhắn chat
- `notifications`: Thông báo cho người dùng

**Nhóm System**:
- `roles`: Vai trò (ROLE_USER, ROLE_WORKER)
- `permissions`: Quyền hạn (nếu cần)

### 7.2 Mô tả các Entity chính

#### 7.2.1 User & Authentication

**users**:
```
id (UUID): Primary key
email: Email (unique)
password: Mật khẩu (hashed with BCrypt)
username: Tên đăng nhập
status: Trạng thái (active, inactive)
role: Vai trò (USER, WORKER)
created_at, updated_at: Timestamps
```

**user_profiles**:
```
id (UUID): Primary key
user_id: FK to users
full_name: Họ tên
phone: Số điện thoại
avatar_url: URL ảnh đại diện
created_at, updated_at: Timestamps
```

**email_verifications**:
```
id (UUID): Primary key
user_id: FK to users (unique)
verification_code: Mã xác thực 6 số
attempts: Số lần thử nhập sai
locked_until: Thời điểm khóa nếu quá 3 lần sai
expired_at: Ngày hết hạn mã (15 phút sau khi tạo)
created_at: Timestamp
```

**worker_profiles**:
```
id (UUID): Primary key
user_id: FK to users
certificate_url: URL chứng chỉ (Cloudinary)
verification_status: pending, verified, rejected
tier_type: Free, Basic, Pro
tier_expired_at: Ngày hết hạn gói
created_at, updated_at: Timestamps
```

#### 7.2.2 Job Post

**job_posts**:
```
id (UUID): Primary key
customer_id: FK to user_profiles
title: Tiêu đề
description: Mô tả
job_type_id: FK to job_types
address: Địa chỉ chi tiết
latitude, longitude: Tọa độ
status: OPEN, IN_PROGRESS, FINISHED, CANCELLED
created_at, updated_at: Timestamps
```

**job_types**:
```
id (BIGINT): Primary key
code: Mã loại (DIEN, NUOC, HARM, CLEAN, v.v.)
name: Tên loại công việc
description: Mô tả
```

**job_post_applications**:
```
id (UUID): Primary key
job_post_id: FK to job_posts
worker_id: FK to worker_profiles
quoted_price: Giá dự kiến
created_at: Timestamp
```

#### 7.2.3 Booking

**bookings**:
```
id (UUID): Primary key
customer_id: FK to user_profiles
worker_id: FK to worker_profiles
job_post_id: FK to job_posts
service_fee: Giá dịch vụ
total_amount: Tổng tiền (bao gồm voucher)
payment_status: pending, completed, failed
booking_status: PENDING, ACCEPTED, PROCESSING, WAITING_CUSTOMER_CONFIRMATION, FINISHED
created_at, updated_at: Timestamps
```

**booking_status_history**:
```
id (UUID): Primary key
booking_id: FK to bookings
previous_status: Trạng thái trước
new_status: Trạng thái mới
changed_at: Timestamp
changed_by: ID của người thay đổi
```

#### 7.2.4 Payment & Wallet

**wallets**:
```
id (UUID): Primary key
worker_id: FK to worker_profiles
balance: Số dư hiện tại
frozen_amount: Tiền bị khóa tạm thời
created_at, updated_at: Timestamps
```

**wallet_transactions**:
```
id (UUID): Primary key
wallet_id: FK to wallets
type: top_up, withdrawal, payment, refund
amount: Số tiền
reference_id: Mã giao dịch VNPay hoặc ID booking
status: pending, completed, failed
created_at: Timestamp
```

**payments**:
```
id (UUID): Primary key
booking_id: FK to bookings
vnpay_transaction_code: Mã giao dịch VNPay
amount: Số tiền
status: pending, success, failure
created_at, updated_at: Timestamps
```

#### 7.2.5 Subscription

**subscriptions**:
```
id (UUID): Primary key
name: Tên gói (Free, Basic, Pro)
price: Giá gói
duration_days: Thời lượng (ngày)
features: Danh sách đặc quyền (JSON)
is_active: Trạng thái
created_at: Timestamp
```

**worker_subscriptions**:
```
id (UUID): Primary key
worker_id: FK to worker_profiles
subscription_id: FK to subscriptions
tier_type: Free, Basic, Pro
expired_at: Ngày hết hạn
created_at: Timestamp
```

#### 7.2.6 Review & Rating

**ratings**:
```
id (UUID): Primary key
customer_id: FK to user_profiles
worker_id: FK to worker_profiles
booking_id: FK to bookings
rating: Số sao (1-5)
comment: Bình luận
created_at, updated_at: Timestamps
```

#### 7.2.7 Chat & Notification

**chat_messages**:
```
id (UUID): Primary key
sender_id: FK to users
receiver_id: FK to users
booking_id: FK to bookings (optional)
message: Nội dung tin nhắn
is_read: Đã đọc
created_at: Timestamp
```

**notifications**:
```
id (UUID): Primary key
user_id: FK to users
title: Tiêu đề
content: Nội dung
type: booking_update, payment, new_offer, v.v.
is_read: Đã đọc
related_id: UUID của booking/job_post/... (nếu có)
created_at: Timestamp
```

---

## 8. WORKFLOW CHÍNH (SƠ ĐỒ QUY TRÌNH)

### 8.1 Quy trình tìm kiếm và đặt dịch vụ

```
Khách hàng truy cập website
         ↓
Đăng ký/Đăng nhập (email hoặc Google OAuth)
         ↓
Duyệt danh sách công việc
         ↓
Tạo bài đăng công việc mới
  ├─ Nhập tiêu đề, mô tả, loại, vị trí
  ↓
Công nhân duyệt danh sách công việc mở
         ↓
Công nhân gửi đơn quan tâm (với giá dự kiến)
         ↓
Khách hàng xem danh sách đơn từ công nhân
         ↓
Khách hàng chọn công nhân và xác nhận
         ↓
Hệ thống tạo booking với trạng thái PENDING
         ↓
Gửi thông báo cho công nhân được chọn
         ↓
Khách hàng thanh toán qua VNPay
         ↓
VNPay callback → Xác minh chữ ký
         ↓
Nếu thanh toán thành công:
  ├─ Cập nhật payment_status = completed
  ├─ Cộng tiền vào ví công nhân
  ├─ Cập nhật booking_status = ACCEPTED
  ├─ Gửi thông báo cho cả hai bên
  ↓
Công nhân cập nhật trạng thái → PROCESSING
         ↓
Công nhân hoàn thành công việc → WAITING_CUSTOMER_CONFIRMATION
         ↓
Khách hàng xác nhận hoàn tất → FINISHED
         ↓
Khách hàng đánh giá công nhân (1-5 sao)
         ↓
Công nhân xem đánh giá và có thể rút tiền
```

### 8.2 Quy trình ví điện tử và rút tiền

```
Công nhân hoàn thành nhiều booking
         ↓
Tiền từ thanh toán được cộng vào ví
         ↓
Công nhân xem số dư ví
         ↓
Công nhân muốn rút tiền
  ├─ Cung cấp số tài khoản ngân hàng
  ├─ Nhập số tiền muốn rút
  ├─ Kiểm tra số dư đủ
  ↓
Tạo yêu cầu rút tiền (PENDING)
         ↓
Admin xử lý yêu cầu rút tiền
         ↓
Chuyển tiền sang tài khoản ngân hàng
         ↓
Cập nhật trạng thái rút tiền (COMPLETED)
         ↓
Công nhân nhận tiền vào ngân hàng
```

### 8.3 Quy trình subscription/tiers

```
Công nhân đăng ký tài khoản
         ↓
Bắt đầu với tier FREE
         ↓
Công nhân xem danh sách gói (Free/Basic/Pro)
         ↓
Chọn gói Basic hoặc Pro
         ↓
Thanh toán giá gói qua VNPay (nếu không phải Free)
         ↓
Cập nhật tier và thời hạn
         ↓
Công nhân được hưởng đặc quyền của gói
  ├─ Pro: Ưu tiên hiển thị, truy cập tất cả công việc
  ├─ Basic: Truy cập hầu hết công việc
  ├─ Free: Truy cập công việc cơ bản
         ↓
Theo dõi ngày hết hạn
         ↓
Khi hết hạn:
  ├─ Tự động trở về tier FREE
  ├─ Có thể nâng cấp lại nếu muốn
```

---

## 9. KẾ HOẠCH TRIỂN KHAI (TIMELINE)

### 9.1 Giai đoạn 1: Setup & Authentication (Tuần 1)
- ✅ Setup project (Backend + Frontend)
- ✅ Cấu hình PostgreSQL + Redis
- ✅ Implement authentication (Đăng ký, Đăng nhập, JWT)
- ✅ Implement OAuth2 (Google)
- ✅ Rate limiting & Lockout mechanism
- ✅ Email verification (6-digit OTP with 15-min expiry)
- ✅ Spring Mail & Thymeleaf template engine setup
- ✅ Email verification endpoints
- ✅ Email verification database schema

### 9.2 Giai đoạn 2: User Profiles (Tuần 1)
- ✅ User profile CRUD
- ✅ Worker profile CRUD
- ✅ Upload chứng chỉ (Cloudinary)
- ✅ Profile verification status

### 9.3 Giai đoạn 3: Job Post Management (Tuần 1-2)
- ✅ CRUD job posts
- ✅ Job types management
- ✅ Job post discovery & search
- ✅ Job post applications (worker gửi đơn)

### 9.4 Giai đoạn 4: Booking System (Tuần 1-2)
- ✅ Create booking
- ✅ Status transitions (state machine)
- ✅ Status history tracking
- ✅ Booking retrieval & filtering

### 9.5 Giai đoạn 5: Payment & Wallet (Tuần 2-3)
- ✅ VNPay integration
- ✅ Wallet management
- ✅ Wallet transactions
- ✅ Withdrawal system

### 9.6 Giai đoạn 6: Subscription & Tiers (Tuần 2-3)
- ✅ Subscription plans
- ✅ Worker subscription management
- ✅ Tier upgrade/downgrade

### 9.7 Giai đoạn 7: Review & Rating (Tuần 3)
- Đánh giá công nhân
- Xem đánh giá
- Xếp hạng công nhân

### 9.8 Giai đoạn 8: Chat & Notifications (Tuần 3)
- Chat real-time (WebSocket STOMP)
- Notifications real-time
- Notification management

### 9.9 Giai đoạn 9: Frontend Integration (Tuần 3-4)
- UI components cho tất cả features
- Form validation & error handling
- Loading states & user feedback
- Responsive design

### 9.10 Giai đoạn 10: Testing & Deployment (Tuần 4)
- Unit tests & Integration tests
- Performance testing
- Security testing
- Bug fixing & optimization
- Docker deployment
- Production deployment

---

## 10. RỦI RO VÀ GIỚI HẠN

### 10.1 Rủi ro kỹ thuật
- **Rủi ro tích hợp VNPay**: API VNPay có thể thay đổi hoặc down
  - Giải pháp: Implement retry mechanism, error handling, logging chi tiết
- **Rủi ro bảo mật**: JWT token bị lộ, data breach
  - Giải pháp: HTTPS, token rotation, secure storage, rate limiting
- **Rủi ro hiệu năng**: Database query chậm khi dữ liệu lớn
  - Giải pháp: Index database, optimize queries, pagination, caching

### 10.2 Rủi ro nghiệp vụ
- **Rủi ro thanh toán**: Giao dịch bị lỗi hoặc không đồng bộ
  - Giải pháp: Implement transaction management, callback verification, audit logging
- **Rủi ro tồn quỹ ví**: Công nhân mất tiền do lỗi hệ thống
  - Giải pháp: Implement validation, balance snapshot, rollback mechanism
- **Rủi ro tranh chấp**: Khách hàng và công nhân tranh cãi về chất lượng dịch vụ
  - Giải pháp: Implement dispute resolution workflow, escrow payment

### 10.3 Giới hạn hiện tại
- Hệ thống hiện tại chỉ hỗ trợ thanh toán qua VNPay
- Chưa có admin dashboard hoàn chỉnh
- Chưa có ứng dụng mobile (chỉ web responsive)
- Chưa có hệ thống AI recommendation
- Chưa có multi-language support

---

## 11. LỢI ÍCH & HƯỚNG PHÁT TRIỂN

### 11.1 Lợi ích
**Cho khách hàng**:
- Tìm kiếm và đặt dịch vụ dễ dàng
- Thanh toán an toàn qua VNPay
- Xem đánh giá công nhân trước khi chọn
- Chat trực tiếp với công nhân
- Theo dõi trạng thái công việc real-time

**Cho công nhân**:
- Tìm kiếm công việc phù hợp
- Quản lý ví điện tử và rút tiền dễ dàng
- Nâng cấp gói subscription để mở rộng cơ hội
- Xây dựng danh tiếng thông qua đánh giá
- Kiếm tiền từ các công việc

### 11.2 Hướng phát triển ngắn hạn
- Tích hợp thêm phương thức thanh toán (Momo, ZaloPay)
- Admin dashboard hoàn chỉnh
- Dispute resolution system
- Advanced search & filtering
- Push notifications

### 11.3 Hướng phát triển dài hạn
- Ứng dụng mobile (iOS, Android)
- AI recommendation system
- Subscription automation
- Affiliate marketing system
- Multi-language support
- Analytics & business intelligence
- Video verification cho chứng chỉ
- Loyalty program

---

## 12. PHỤ LỤC

### 12.1 API Endpoints chính

**Authentication**
```
POST /api/v1/auth/register - Đăng ký
POST /api/v1/auth/verify-email - Xác thực email bằng mã 6 số
POST /api/v1/auth/resend-verification-code - Gửi lại mã xác thực
POST /api/v1/auth/login - Đăng nhập
POST /api/v1/auth/google - Đăng nhập Google
POST /api/v1/auth/refresh - Refresh access token
POST /api/v1/auth/logout - Đăng xuất
POST /api/v1/auth/forgot-password - Quên mật khẩu
```

**User Profile**
```
GET /api/v1/user/profile - Lấy thông tin profile
PUT /api/v1/user/profile - Cập nhật profile
PUT /api/v1/user/password - Đổi mật khẩu
```

**Worker Profile**
```
GET /api/v1/worker/profile - Lấy thông tin worker
PUT /api/v1/worker/profile - Cập nhật profile
POST /api/v1/worker/certificate - Upload chứng chỉ
GET /api/v1/worker/{id} - Xem profile công nhân khác
```

**Job Posts**
```
POST /api/v1/job-posts - Tạo bài đăng
GET /api/v1/job-posts/my-posts - Danh sách bài đăng của mình
GET /api/v1/job-posts/discover/open - Danh sách công việc mở
GET /api/v1/job-posts/discover/by-type - Lọc theo loại
GET /api/v1/job-posts/{id} - Chi tiết bài đăng
PATCH /api/v1/job-posts/{id} - Chỉnh sửa bài đăng
DELETE /api/v1/job-posts/{id} - Xóa bài đăng
```

**Job Post Applications**
```
POST /api/v1/job-posts/{id}/apply - Gửi đơn
GET /api/v1/job-posts/{id}/applications - Xem danh sách đơn
```

**Bookings**
```
POST /api/v1/bookings - Tạo booking
GET /api/v1/bookings - Danh sách booking của mình
GET /api/v1/bookings/{id} - Chi tiết booking
PATCH /api/v1/bookings/{id}/accept - Chấp nhận booking
PATCH /api/v1/bookings/{id}/decline - Từ chối booking
PATCH /api/v1/bookings/{id}/start - Bắt đầu dịch vụ
PATCH /api/v1/bookings/{id}/complete - Hoàn thành dịch vụ
PATCH /api/v1/bookings/{id}/confirm - Xác nhận hoàn tất
```

**Payment**
```
POST /api/v1/payment/vnpay - Tạo URL thanh toán VNPay
GET /api/v1/payment/vnpay-callback - Callback từ VNPay
```

**Wallet**
```
GET /api/v1/wallet/balance - Xem số dư
POST /api/v1/wallet/topup - Top-up tiền
POST /api/v1/wallet/withdraw - Rút tiền
GET /api/v1/wallet/history - Lịch sử giao dịch
```

**Subscriptions**
```
GET /api/v1/subscriptions/plans - Danh sách gói
POST /api/v1/subscriptions/subscribe - Chọn gói
GET /api/v1/subscriptions/info - Thông tin gói hiện tại
```

**Ratings**
```
POST /api/v1/ratings - Tạo đánh giá
GET /api/v1/ratings/worker/{id} - Danh sách đánh giá công nhân
```

**Chat**
```
GET /api/v1/chat/{userId} - Lịch sử chat
POST /api/v1/chat/{userId} - Gửi tin nhắn
```

**Notifications**
```
GET /api/v1/notifications - Danh sách thông báo
PATCH /api/v1/notifications/{id}/read - Đánh dấu đã đọc
DELETE /api/v1/notifications/{id} - Xóa thông báo
```

### 12.2 Cấu trúc thư mục dự án

```
HandyGo/
├── mock-backend/                      # Spring Boot Backend
│   ├── src/main/java/
│   │   ├── config/                   # Configuration (Security, CORS, Redis, etc)
│   │   ├── controller/               # REST Controllers
│   │   ├── service/                  # Business logic services
│   │   ├── repository/               # Data access layer
│   │   ├── model/                    # JPA Entities
│   │   ├── dto/                      # Data Transfer Objects
│   │   ├── mapper/                   # MapStruct mappers
│   │   ├── exception/                # Exception handling
│   │   ├── util/                     # Utility classes
│   │   ├── validator/                # Custom validators
│   │   └── filter/                   # JWT filters
│   ├── src/main/resources/
│   │   ├── application.yaml          # Main configuration
│   │   ├── application-prod.yaml     # Production config
│   │   └── db/migration/             # Flyway migrations
│   ├── pom.xml                       # Maven configuration
│   └── Dockerfile
│
├── mock-frontend/                     # React Frontend
│   ├── src/
│   │   ├── api/                      # API clients (axios, services)
│   │   ├── components/               # React components
│   │   ├── pages/                    # Page components
│   │   ├── modules/                  # Feature modules (auth, booking, chat, etc)
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── context/                  # Context API
│   │   ├── utils/                    # Utility functions
│   │   ├── constants/                # Constants
│   │   ├── styles/                   # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/                       # Static files
│   ├── .env                          # Environment variables
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
│
├── docs/                              # Documentation
│   ├── specs/                        # Specification documents
│   ├── API_REFERENCE.md
│   ├── AUTH_FLOW_SUMMARY.md
│   ├── BOOKING_FEATURE_SUMMARY.md
│   └── ...
│
├── docker-compose.yml                # Docker Compose for local development
├── README.md
├── SYSTEM_SPECIFICATION.md           # This file
└── .github/
    └── copilot-instructions.md       # Development guidelines

```

### 12.3 Môi trường phát triển

**Yêu cầu**:
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Maven 3.6+
- npm hoặc yarn

**Biến môi trường cần thiết**:

*Backend (.env hoặc application.yaml)*:
```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/handygo
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

JWT_SECRET_KEY=your-secret-key-here
JWT_ACCESS_TOKEN_EXPIRY_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

VNPAY_TMN_CODE=your-vnpay-merchant-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_RETURN_URL=http://localhost:3000/payment/callback
VNPAY_NOTIFY_URL=http://your-domain/api/payment/vnpay-callback

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

GMAIL_USERNAME=your-gmail@gmail.com
GMAIL_PASSWORD=your-app-specific-password

GOOGLE_MAPS_API_KEY=your-google-maps-api-key

APP_BASE_URL=http://localhost:8080
APP_FE_URL=http://localhost:3000
```

*Frontend (.env)*:
```
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 12.4 Tài liệu tham khảo
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [JWT Introduction](https://jwt.io/introduction)
- [VNPay Integration Guide](https://vnpay.vn/)
- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Google Maps API Documentation](https://developers.google.com/maps)

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-26  
**Status**: Draft  
**Maintained By**: Development Team
