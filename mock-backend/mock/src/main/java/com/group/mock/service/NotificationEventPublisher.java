package com.group.mock.service;

import com.group.mock.entity.DTO.response.NotificationResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import com.group.mock.configuration.NotificationWebSocketHandler;

/**
 * Service to publish notification events that trigger notification creation
 * and WebSocket delivery
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventPublisher {
    
    private final NotificationService notificationService;
    private final NotificationFactory notificationFactory;
    private final ApplicationEventPublisher eventPublisher;
    private final NotificationWebSocketHandler webSocketHandler;

    /**
     * Publish booking created notification
     */
    public void publishBookingCreated(UUID workerId, Long bookingId, String customerName, String serviceName) {
        try {
            var notifData = notificationFactory.createBookingNotification(
                NotificationFactory.BOOKING_CREATED,
                bookingId,
                customerName,
                serviceName
            );
            
            NotificationResponse response = notificationService.createNotification(
                workerId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(workerId.toString(), response);
            
            log.info("Published BOOKING_CREATED notification for worker: {}", workerId);
        } catch (Exception e) {
            log.error("Error publishing booking created notification", e);
        }
    }

    /**
     * Publish booking cancelled notification
     */
    public void publishBookingCancelled(UUID recipientId, Long bookingId, String customerName, String serviceName) {
        try {
            var notifData = notificationFactory.createBookingNotification(
                NotificationFactory.BOOKING_CANCELLED,
                bookingId,
                customerName,
                serviceName
            );
            
            NotificationResponse response = notificationService.createNotification(
                recipientId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(recipientId.toString(), response);
            
            log.info("Published BOOKING_CANCELLED notification for user: {}", recipientId);
        } catch (Exception e) {
            log.error("Error publishing booking cancelled notification", e);
        }
    }

    /**
     * Publish booking accepted notification
     */
    public void publishBookingAccepted(UUID customerId, Long bookingId, String workerName, String serviceName) {
        try {
            var notifData = notificationFactory.createBookingNotification(
                NotificationFactory.BOOKING_ACCEPTED,
                bookingId,
                workerName,
                serviceName
            );
            
            NotificationResponse response = notificationService.createNotification(
                customerId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(customerId.toString(), response);
            
            log.info("Published BOOKING_ACCEPTED notification for customer: {}", customerId);
        } catch (Exception e) {
            log.error("Error publishing booking accepted notification", e);
        }
    }

    /**
     * Publish booking rejected notification
     */
    public void publishBookingRejected(UUID customerId, Long bookingId, String serviceName) {
        try {
            var notifData = notificationFactory.createBookingNotification(
                NotificationFactory.BOOKING_REJECTED,
                bookingId,
                "Worker",
                serviceName
            );
            
            NotificationResponse response = notificationService.createNotification(
                customerId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(customerId.toString(), response);
            
            log.info("Published BOOKING_REJECTED notification for customer: {}", customerId);
        } catch (Exception e) {
            log.error("Error publishing booking rejected notification", e);
        }
    }

    /**
     * Publish booking completed notification
     */
    public void publishBookingCompleted(UUID customerId, Long bookingId, String serviceName) {
        try {
            var notifData = notificationFactory.createBookingNotification(
                NotificationFactory.BOOKING_COMPLETED,
                bookingId,
                "Worker",
                serviceName
            );
            
            NotificationResponse response = notificationService.createNotification(
                customerId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(customerId.toString(), response);
            
            log.info("Published BOOKING_COMPLETED notification for customer: {}", customerId);
        } catch (Exception e) {
            log.error("Error publishing booking completed notification", e);
        }
    }

    /**
     * Publish new message notification
     */
    public void publishMessageNew(UUID recipientId, String chatId, String senderName, String messagePreview) {
        try {
            var notifData = notificationFactory.createMessageNotification(chatId, senderName, messagePreview);
            
            NotificationResponse response = notificationService.createNotification(
                recipientId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(recipientId.toString(), response);
            
            log.info("Published MESSAGE_NEW notification for user: {}", recipientId);
        } catch (Exception e) {
            log.error("Error publishing message notification", e);
        }
    }

    /**
     * Publish wallet top-up success notification
     */
    public void publishWalletTopupSuccess(UUID userId, Long transactionId, Long amount) {
        try {
            var notifData = notificationFactory.createPaymentNotification(
                NotificationFactory.WALLET_TOPUP_SUCCESS,
                transactionId,
                amount,
                "SUCCESS"
            );
            
            NotificationResponse response = notificationService.createNotification(
                userId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(userId.toString(), response);
            
            log.info("Published WALLET_TOPUP_SUCCESS notification for user: {}", userId);
        } catch (Exception e) {
            log.error("Error publishing wallet topup success notification", e);
        }
    }

    /**
     * Publish wallet top-up failed notification
     */
    public void publishWalletTopupFailed(UUID userId, Long transactionId, Long amount) {
        try {
            var notifData = notificationFactory.createPaymentNotification(
                NotificationFactory.WALLET_TOPUP_FAILED,
                transactionId,
                amount,
                "FAILED"
            );
            
            NotificationResponse response = notificationService.createNotification(
                userId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(userId.toString(), response);
            
            log.info("Published WALLET_TOPUP_FAILED notification for user: {}", userId);
        } catch (Exception e) {
            log.error("Error publishing wallet topup failed notification", e);
        }
    }

    /**
     * Publish subscription upgrade notification
     */
    public void publishSubscriptionUpgrade(UUID userId, String planName, Long durationDays) {
        try {
            var notifData = notificationFactory.createSubscriptionNotification(
                NotificationFactory.SUBSCRIPTION_UPGRADE,
                planName,
                durationDays
            );
            
            NotificationResponse response = notificationService.createNotification(
                userId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(userId.toString(), response);
            
            log.info("Published SUBSCRIPTION_UPGRADE notification for user: {}", userId);
        } catch (Exception e) {
            log.error("Error publishing subscription upgrade notification", e);
        }
    }

    /**
     * Publish subscription expiring notification
     */
    public void publishSubscriptionExpiring(UUID userId, String planName, Long daysRemaining) {
        try {
            var notifData = notificationFactory.createSubscriptionNotification(
                NotificationFactory.SUBSCRIPTION_EXPIRING,
                planName,
                daysRemaining
            );
            
            NotificationResponse response = notificationService.createNotification(
                userId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(userId.toString(), response);
            
            log.info("Published SUBSCRIPTION_EXPIRING notification for user: {}", userId);
        } catch (Exception e) {
            log.error("Error publishing subscription expiring notification", e);
        }
    }

    /**
     * Publish profile approved notification
     */
    public void publishProfileApproved(UUID workerId) {
        try {
            var notifData = notificationFactory.createProfileNotification(
                NotificationFactory.PROFILE_APPROVED,
                null
            );
            
            NotificationResponse response = notificationService.createNotification(
                workerId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(workerId.toString(), response);
            
            log.info("Published PROFILE_APPROVED notification for worker: {}", workerId);
        } catch (Exception e) {
            log.error("Error publishing profile approved notification", e);
        }
    }

    /**
     * Publish profile rejected notification
     */
    public void publishProfileRejected(UUID workerId, String reason) {
        try {
            var notifData = notificationFactory.createProfileNotification(
                NotificationFactory.PROFILE_REJECTED,
                reason
            );
            
            NotificationResponse response = notificationService.createNotification(
                workerId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(workerId.toString(), response);
            
            log.info("Published PROFILE_REJECTED notification for worker: {}", workerId);
        } catch (Exception e) {
            log.error("Error publishing profile rejected notification", e);
        }
    }

    /**
     * Publish review created notification
     */
    public void publishReviewCreated(UUID workerId, Long reviewId, String reviewerName, Integer rating, String comment) {
        try {
            var notifData = notificationFactory.createReviewNotification(reviewId, reviewerName, rating, comment);
            
            NotificationResponse response = notificationService.createNotification(
                workerId,
                notifData.type,
                notifData.title,
                notifData.message,
                notifData.data
            );
            webSocketHandler.sendNotificationToUser(workerId.toString(), response);
            
            log.info("Published REVIEW_CREATED notification for worker: {}", workerId);
        } catch (Exception e) {
            log.error("Error publishing review created notification", e);
        }
    }
}
