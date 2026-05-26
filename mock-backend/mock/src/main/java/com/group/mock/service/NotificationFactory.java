package com.group.mock.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Data
@Slf4j
public class NotificationFactory {
    
    private final ObjectMapper objectMapper;

    // Notification Types Constants
    public static final String BOOKING_CREATED = "BOOKING_CREATED";
    public static final String BOOKING_CANCELLED = "BOOKING_CANCELLED";
    public static final String BOOKING_ACCEPTED = "BOOKING_ACCEPTED";
    public static final String BOOKING_REJECTED = "BOOKING_REJECTED";
    public static final String BOOKING_EXPIRED = "BOOKING_EXPIRED";
    public static final String BOOKING_PROCESSING = "BOOKING_PROCESSING";
    public static final String BOOKING_COMPLETED = "BOOKING_COMPLETED";
    public static final String BOOKING_CONFIRMED = "BOOKING_CONFIRMED";
    public static final String REVIEW_CREATED = "REVIEW_CREATED";
    public static final String MESSAGE_NEW = "MESSAGE_NEW";
    public static final String WALLET_TOPUP_SUCCESS = "WALLET_TOPUP_SUCCESS";
    public static final String WALLET_TOPUP_FAILED = "WALLET_TOPUP_FAILED";
    public static final String SUBSCRIPTION_UPGRADE = "SUBSCRIPTION_UPGRADE";
    public static final String SUBSCRIPTION_EXPIRING = "SUBSCRIPTION_EXPIRING";
    public static final String PROFILE_APPROVED = "PROFILE_APPROVED";
    public static final String PROFILE_REJECTED = "PROFILE_REJECTED";
    public static final String JOB_POST_NEW = "JOB_POST_NEW";
    public static final String JOB_APPLICATION_NEW = "JOB_APPLICATION_NEW";
    public static final String JOB_APPLICATION_ACCEPTED = "JOB_APPLICATION_ACCEPTED";
    public static final String JOB_APPLICATION_REJECTED = "JOB_APPLICATION_REJECTED";
    public static final String JOB_POST_CANCELLED_NO_APPLICANTS = "JOB_POST_CANCELLED_NO_APPLICANTS";

    /**
     * Create booking notification
     */
    public NotificationData createBookingNotification(String type, Long bookingId, String customerName, String serviceName) {
        String title, message;
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", bookingId);
        data.put("customerName", customerName);
        data.put("serviceName", serviceName);

        switch (type) {
            case BOOKING_CREATED:
                title = "Có đơn đặt lịch mới";
                message = "Khách hàng " + customerName + " vừa đặt lịch dịch vụ " + serviceName;
                break;
            case BOOKING_CANCELLED:
                title = "Đơn đặt lịch bị hủy";
                message = "Khách hàng " + customerName + " đã hủy đơn đặt lịch dịch vụ " + serviceName;
                break;
            case BOOKING_ACCEPTED:
                title = "Đơn đặt lịch được chấp nhận";
                message = "Người thợ đã chấp nhận đơn đặt lịch của bạn";
                break;
            case BOOKING_REJECTED:
                title = "Đơn đặt lịch bị từ chối";
                message = "Rất tiếc, người thợ không thể chấp nhận đơn đặt lịch của bạn";
                break;
            case BOOKING_EXPIRED:
                title = "Đơn đặt lịch đã hết hạn";
                message = "Đơn đặt lịch dịch vụ " + serviceName + " đã tự động kết thúc do quá giờ hẹn";
                break;
            case BOOKING_PROCESSING:
                title = "Thợ đã bắt đầu xử lý";
                message = "Thợ đã bắt đầu xử lý dịch vụ " + serviceName;
                break;
            case BOOKING_COMPLETED:
                title = "Công việc hoàn thành";
                message = "Người thợ đã báo hoàn thành dịch vụ " + serviceName + ". Vui lòng kiểm tra và xác nhận.";
                break;
            case BOOKING_CONFIRMED:
                title = "Khách hàng đã xác nhận hoàn thành";
                message = "Khách hàng đã xác nhận hoàn thành dịch vụ " + serviceName;
                break;
            default:
                title = "Thông báo đặt lịch";
                message = "Có cập nhật về đơn đặt lịch của bạn";
        }

        return new NotificationData(type, title, message, data);
    }

    public NotificationData createBookingExpiredNotification(Long bookingId, String customerName, String serviceName, String reason) {
        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", bookingId);
        data.put("customerName", customerName);
        data.put("serviceName", serviceName);
        data.put("reason", reason);
        return new NotificationData(
                BOOKING_EXPIRED,
                "Đơn đặt lịch đã hết hạn",
                reason != null && !reason.isBlank()
                        ? reason
                        : ("Đơn đặt lịch dịch vụ " + serviceName + " đã tự động kết thúc do quá giờ hẹn"),
                data);
    }

    /**
     * Create message notification
     */
    public NotificationData createMessageNotification(String chatId, String senderName, String messagePreview) {
        Map<String, Object> data = new HashMap<>();
        data.put("chatId", chatId);
        data.put("senderName", senderName);

        return new NotificationData(
            MESSAGE_NEW,
            "Tin nhắn mới từ " + senderName,
            messagePreview,
            data
        );
    }

    public NotificationData createJobPostCancelledNoApplicants(UUID jobPostId, String jobTitle) {
        Map<String, Object> data = new HashMap<>();
        data.put("jobPostId", jobPostId);
        data.put("jobTitle", jobTitle);
        return new NotificationData(
                JOB_POST_CANCELLED_NO_APPLICANTS,
                "Công việc đã hủy",
                "Không có thợ nào đăng ký cho công việc \"" + (jobTitle == null ? "" : jobTitle) + "\" trước giờ hẹn.",
                data);
    }

    /**
     * Create wallet/payment notification
     */
    public NotificationData createPaymentNotification(String type, Long transactionId, Long amount, String status) {
        String title, message;
        Map<String, Object> data = new HashMap<>();
        data.put("transactionId", transactionId);
        data.put("amount", amount);
        data.put("status", status);

        if (WALLET_TOPUP_SUCCESS.equals(type)) {
            title = "Nạp tiền thành công";
            message = "Bạn đã nạp " + formatCurrency(amount) + " vào ví";
        } else {
            title = "Nạp tiền thất bại";
            message = "Nạp tiền " + formatCurrency(amount) + " không thành công. Vui lòng thử lại";
        }

        return new NotificationData(type, title, message, data);
    }

    /**
     * Create subscription notification
     */
    public NotificationData createSubscriptionNotification(String type, String planName, Long daysRemaining) {
        String title, message;
        Map<String, Object> data = new HashMap<>();
        data.put("planName", planName);
        data.put("daysRemaining", daysRemaining);

        if (SUBSCRIPTION_UPGRADE.equals(type)) {
            title = "Nâng cấp gói cước thành công";
            message = "Bạn đã nâng cấp lên gói " + planName;
        } else {
            title = "Gói cước sắp hết hạn";
            message = "Gói " + planName + " của bạn sẽ hết hạn trong " + daysRemaining + " ngày";
        }

        return new NotificationData(type, title, message, data);
    }

    /**
     * Create profile notification
     */
    public NotificationData createProfileNotification(String type, String reason) {
        String title, message;
        Map<String, Object> data = new HashMap<>();
        
        if (PROFILE_APPROVED.equals(type)) {
            title = "Hồ sơ được phê duyệt";
            message = "Hồ sơ công nhân của bạn đã được phê duyệt thành công";
            data.put("status", "APPROVED");
        } else {
            title = "Hồ sơ bị từ chối";
            message = "Hồ sơ của bạn cần được chỉnh sửa. Lý do: " + reason;
            data.put("status", "REJECTED");
            data.put("reason", reason);
        }

        return new NotificationData(type, title, message, data);
    }

    /**
     * Create review notification
     */
    public NotificationData createReviewNotification(Long reviewId, String reviewerName, Integer rating, String comment) {
        Map<String, Object> data = new HashMap<>();
        data.put("reviewId", reviewId);
        data.put("reviewerName", reviewerName);
        data.put("rating", rating);

        String title = reviewerName + " đã đánh giá bạn " + rating + " sao";
        String message = comment != null && !comment.isEmpty() ? comment.substring(0, Math.min(100, comment.length())) : "Xem đánh giá chi tiết";

        return new NotificationData(REVIEW_CREATED, title, message, data);
    }

    public NotificationData createJobPostNotification(
            java.util.UUID jobPostId, String jobTitle, String jobType) {
        Map<String, Object> data = new HashMap<>();
        data.put("jobPostId", jobPostId != null ? jobPostId.toString() : null);
        data.put("jobTitle", jobTitle);
        data.put("jobType", jobType);
        return new NotificationData(
                JOB_POST_NEW,
                "Công việc mới phù hợp",
                "Có công việc \"" + jobTitle + "\" (" + jobType + ") vừa được đăng",
                data);
    }

    public NotificationData createJobApplicationNotification(
            String type,
            java.util.UUID jobPostId,
            java.util.UUID applicationId,
            String jobTitle,
            String jobType,
            String actorName) {
        Map<String, Object> data = new HashMap<>();
        data.put("jobPostId", jobPostId != null ? jobPostId.toString() : null);
        data.put("applicationId", applicationId != null ? applicationId.toString() : null);
        data.put("jobTitle", jobTitle);
        data.put("jobType", jobType);

        String title;
        String message;
        switch (type) {
            case JOB_APPLICATION_NEW:
                title = "Có thợ đăng ký công việc";
                message = actorName + " vừa đăng ký công việc \"" + jobTitle + "\"";
                break;
            case JOB_APPLICATION_ACCEPTED:
                title = "Bạn được chọn cho công việc";
                message = "Khách hàng đã chấp nhận đăng ký của bạn cho \"" + jobTitle + "\"";
                break;
            case JOB_APPLICATION_REJECTED:
                title = "Đăng ký không được chọn";
                message = "Khách hàng đã chọn thợ khác cho \"" + jobTitle + "\"";
                break;
            default:
                title = "Thông báo công việc";
                message = "Có cập nhật về công việc";
        }
        return new NotificationData(type, title, message, data);
    }

    /**
     * Convert notification data to JSON string
     */
    public String toJson(NotificationData notificationData) {
        try {
            return objectMapper.writeValueAsString(notificationData.data);
        } catch (Exception e) {
            log.error("Error converting notification data to JSON", e);
            return "{}";
        }
    }

    private String formatCurrency(Long amount) {
        if (amount == null) return "0đ";
        return String.format("%,d đ", amount);
    }

    /**
     * Inner class to hold notification data
     */
    public static class NotificationData {
        public final String type;
        public final String title;
        public final String message;
        public final Map<String, Object> data;

        public NotificationData(String type, String title, String message, Map<String, Object> data) {
            this.type = type;
            this.title = title;
            this.message = message;
            this.data = data;
        }
    }
}
