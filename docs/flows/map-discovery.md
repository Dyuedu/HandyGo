**Khám phá trên bản đồ (Map Discovery)**

Người dùng mở Map Discovery

         ↓

Yêu cầu geolocation (nếu chấp nhận) → gửi updateLocation lên backend

         ↓

Frontend gọi getAllOpenJobPosts + getUserLocations → hiển thị markers job posts và workers

         ↓

Người dùng nhấn xem chỉ đường → `JobPostRouteMap` gọi OSRM để vẽ route