package com.group.mock.service;

import com.group.mock.entity.DTO.response.NotificationListResponse;
import com.group.mock.entity.DTO.response.NotificationResponse;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    
    /**
     * Create and save a new notification
     */
    NotificationResponse createNotification(
        UUID userId,
        String type,
        String title,
        String message,
        java.util.Map<String, Object> data
    );

    /**
     * Get paginated notifications for a user
     */
    NotificationListResponse getNotificationsByUser(UUID userId, Pageable pageable);

    /**
     * Get unread notifications for a user
     */
    NotificationListResponse getUnreadNotificationsByUser(UUID userId, Pageable pageable);

    /**
     * Get notifications by type for a user
     */
    NotificationListResponse getNotificationsByUserAndType(UUID userId, String type, Pageable pageable);

    /**
     * Count unread notifications for a user
     */
    long getUnreadCount(UUID userId);

    /**
     * Get single notification by ID
     */
    NotificationResponse getNotificationById(Long notificationId);

    /**
     * Mark notification as read
     */
    void markAsRead(Long notificationId);

    /**
     * Mark all notifications as read for a user
     */
    void markAllAsRead(UUID userId);

    /**
     * Delete notification by ID
     */
    void deleteNotification(Long notificationId);

    /**
     * Delete all notifications older than specified days
     */
    int deleteOldNotifications(int days);

    /**
     * Delete all notifications for a user (cleanup)
     */
    void deleteAllByUserId(UUID userId);
}
