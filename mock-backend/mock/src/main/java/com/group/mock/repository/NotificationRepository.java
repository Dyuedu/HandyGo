package com.group.mock.repository;

import com.group.mock.entity.Notification;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find all notifications for a user with pagination
     */
    Page<Notification> findByUserId(UUID userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    Page<Notification> findByUserIdAndIsReadFalse(UUID userId, Pageable pageable);

    /**
     * Count unread notifications for a user
     */
    long countByUserIdAndIsReadFalse(UUID userId);

    /**
     * Find notifications by type for a user
     */
    Page<Notification> findByUserIdAndType(UUID userId, String type, Pageable pageable);

    /**
     * Find notifications in a date range
     */
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.createdAt BETWEEN :startDate AND :endDate ORDER BY n.createdAt DESC")
    Page<Notification> findByUserIdAndDateRange(
        @Param("userId") UUID userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    /**
     * Mark a notification as read
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.id = :notificationId")
    void markAsRead(@Param("notificationId") Long notificationId);

    /**
     * Mark all notifications for a user as read
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.userId = :userId")
    int markAllAsRead(@Param("userId") UUID userId);

    /**
     * Delete notifications older than specified days
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :beforeDate")
    int deleteOldNotifications(@Param("beforeDate") LocalDateTime beforeDate);

    /**
     * Delete all notifications for a user
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId")
    int deleteAllByUserId(@Param("userId") UUID userId);
}
