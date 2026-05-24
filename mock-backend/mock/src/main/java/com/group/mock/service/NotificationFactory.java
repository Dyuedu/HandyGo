package com.group.mock.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationFactory {
    
    private final ObjectMapper objectMapper;

    // Notification Types Constants
    public static final String BOOKING_CREATED = "BOOKING_CREATED";
    public static final String BOOKING_CANCELLED = "BOOKING_CANCELLED";
    public static final String BOOKING_ACCEPTED = "BOOKING_ACCEPTED";
    public static final String BOOKING_REJECTED = "BOOKING_REJECTED";
    public static final String BOOKING_COMPLETED = "BOOKING_COMPLETED";
    public static final String REVIEW_CREATED = "REVIEW_CREATED";
    public static final String MESSAGE_NEW = "MESSAGE_NEW";
    public static final String WALLET_TOPUP_SUCCESS = "WALLET_TOPUP_SUCCESS";
    public static final String WALLET_TOPUP_FAILED = "WALLET_TOPUP_FAILED";
    public static final String SUBSCRIPTION_UPGRADE = "SUBSCRIPTION_UPGRADE";
    public static final String SUBSCRIPTION_EXPIRING = "SUBSCRIPTION_EXPIRING";
    public static final String PROFILE_APPROVED = "PROFILE_APPROVED";
    public static final String PROFILE_REJECTED = "PROFILE_REJECTED";

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
            case BOOKING_COMPLETED:
                title = "Công việc hoàn thành";
                message = "Người thợ đã hoàn thành dịch vụ " + serviceName;
                break;
            default:
                title = "Thông báo đặt lịch";
                message = "Có cập nhật về đơn đặt lịch của bạn";
        }

        return new NotificationData(type, title, message, data);
    }

    /**
     * Create message notification
     */
    public NotificationData createMessageNotification(Long chatId, String senderName, String messagePreview) {
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

    /**
     * Convert notification data to JSON string
     */
    public String toJson(NotificationData notificationData) {
        try {
            return objectMapper.writeValueAsString(notificationData.getData());
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
