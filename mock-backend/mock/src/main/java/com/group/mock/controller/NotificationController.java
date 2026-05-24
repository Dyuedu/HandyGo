package com.group.mock.controller;

import com.group.mock.entity.DTO.response.NotificationListResponse;
import com.group.mock.entity.DTO.response.NotificationResponse;
import com.group.mock.service.NotificationService;
import java.security.Principal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;

    /**
     * Get paginated notifications for the current user
     * GET /api/v1/notifications?page=0&limit=10&type=BOOKING_CREATED&sort=createdAt,desc
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKER', 'ADMIN')")
    public ResponseEntity<NotificationListResponse> getNotifications(
        Principal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int limit,
        @RequestParam(required = false) String type
    ) {
        UUID userId = UUID.fromString(principal.getName());
        Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());

        log.debug("Fetching notifications for user: {}, page: {}, limit: {}", userId, page, limit);

        NotificationListResponse response;
        if (type != null && !type.isEmpty()) {
            response = notificationService.getNotificationsByUserAndType(userId, type, pageable);
            log.debug("Fetched {} notifications of type {} for user: {}", 
                response.getContent().size(), type, userId);
        } else {
            response = notificationService.getNotificationsByUser(userId, pageable);
            log.debug("Fetched {} notifications for user: {}", response.getContent().size(), userId);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Get unread notifications count for the current user
     * GET /api/v1/notifications/unread-count
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKER', 'ADMIN')")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        long count = notificationService.getUnreadCount(userId);
        
        log.debug("Unread count for user {}: {}", userId, count);
        return ResponseEntity.ok(count);
    }

    /**
     * Get single notification by ID
     * GET /api/v1/notifications/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKER', 'ADMIN')")
    public ResponseEntity<NotificationResponse> getNotificationById(
        Principal principal,
        @PathVariable Long id
    ) {
        UUID userId = UUID.fromString(principal.getName());
        NotificationResponse notification = notificationService.getNotificationById(id);
        
        log.debug("Fetched notification {} for user: {}", id, userId);
        return ResponseEntity.ok(notification);
    }

    /**
     * Mark a notification as read
     * PUT /api/v1/notifications/{id}/read
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKER', 'ADMIN')")
    public ResponseEntity<Void> markAsRead(
        Principal principal,
        @PathVariable Long id
    ) {
        UUID userId = UUID.fromString(principal.getName());
        notificationService.markAsRead(id);
        
        log.info("Marked notification {} as read by user: {}", id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Mark all notifications as read for the current user
     * PUT /api/v1/notifications/read-all
     */
    @PutMapping("/read-all")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKER', 'ADMIN')")
    public ResponseEntity<Void> markAllAsRead(Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        notificationService.markAllAsRead(userId);
        
        log.info("Marked all notifications as read for user: {}", userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete a notification
     * DELETE /api/v1/notifications/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKER', 'ADMIN')")
    public ResponseEntity<Void> deleteNotification(
        Principal principal,
        @PathVariable Long id
    ) {
        UUID userId = UUID.fromString(principal.getName());
        notificationService.deleteNotification(id);
        
        log.info("Deleted notification {} by user: {}", id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete old notifications (admin only)
     * DELETE /api/v1/notifications/cleanup?days=90
     */
    @DeleteMapping("/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Integer> deleteOldNotifications(
        @RequestParam(defaultValue = "90") int days
    ) {
        int count = notificationService.deleteOldNotifications(days);
        log.info("Deleted {} old notifications (older than {} days)", count, days);
        return ResponseEntity.ok(count);
    }

    /**
     * Exception handler for invalid notification ID
     */
    @GetMapping("/error")
    public ResponseEntity<String> handleError() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body("Notification not found");
    }
}
