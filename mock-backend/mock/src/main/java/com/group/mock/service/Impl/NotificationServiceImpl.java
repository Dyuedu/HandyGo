package com.group.mock.service.Impl;

import com.group.mock.entity.Notification;
import com.group.mock.entity.DTO.response.NotificationListResponse;
import com.group.mock.entity.DTO.response.NotificationResponse;
import com.group.mock.repository.NotificationRepository;
import com.group.mock.service.NotificationService;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    
    private final NotificationRepository notificationRepository;

    @Override
    public NotificationResponse createNotification(
        UUID userId,
        String type,
        String title,
        String message,
        java.util.Map<String, Object> data
    ) {
        Notification notification = Notification.builder()
            .userId(userId)
            .type(type)
            .title(title)
            .message(message)
            .data(data)
            .isRead(false)
            .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification: {} for user: {}", saved.getId(), userId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationListResponse getNotificationsByUser(UUID userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserId(userId, pageable);
        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
        
        return NotificationListResponse.fromPageAndUnreadCount(
            convertToResponsePage(page),
            unreadCount
        );
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationListResponse getUnreadNotificationsByUser(UUID userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByUserIdAndIsReadFalse(userId, pageable);
        long unreadCount = page.getTotalElements();
        
        return NotificationListResponse.fromPageAndUnreadCount(
            convertToResponsePage(page),
            unreadCount
        );
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationListResponse getNotificationsByUserAndType(
        UUID userId,
        String type,
        Pageable pageable
    ) {
        Page<Notification> page = notificationRepository.findByUserIdAndType(userId, type, pageable);
        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
        
        return NotificationListResponse.fromPageAndUnreadCount(
            convertToResponsePage(page),
            unreadCount
        );
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getNotificationById(Long notificationId) {
        return notificationRepository.findById(notificationId)
            .map(this::mapToResponse)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
    }

    @Override
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
        log.debug("Marked notification {} as read", notificationId);
    }

    @Override
    public void markAllAsRead(UUID userId) {
        int count = notificationRepository.markAllAsRead(userId);
        log.info("Marked {} notifications as read for user: {}", count, userId);
    }

    @Override
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
        log.debug("Deleted notification: {}", notificationId);
    }

    @Override
    public int deleteOldNotifications(int days) {
        LocalDateTime beforeDate = LocalDateTime.now().minusDays(days);
        int count = notificationRepository.deleteOldNotifications(beforeDate);
        log.info("Deleted {} notifications older than {} days", count, days);
        return count;
    }

    @Override
    public void deleteAllByUserId(UUID userId) {
        int count = notificationRepository.deleteAllByUserId(userId);
        log.info("Deleted {} notifications for user: {}", count, userId);
    }

    // Helper methods
    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
            .id(notification.getId())
            .type(notification.getType())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .data(notification.getData())
            .isRead(notification.isRead())
            .readAt(notification.getReadAt())
            .createdAt(notification.getCreatedAt())
            .updatedAt(notification.getUpdatedAt())
            .build();
    }

    private PageImpl<NotificationResponse> convertToResponsePage(Page<Notification> page) {
        return new PageImpl<>(
            page.getContent().stream()
                .map(this::mapToResponse)
                .toList(),
            page.getPageable(),
            page.getTotalElements()
        );
    }
}
