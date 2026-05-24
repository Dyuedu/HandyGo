package com.group.mock.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.group.mock.entity.DTO.response.NotificationResponse;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketHandler {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    
    // Store active user connections
    private final Map<String, String> activeUsers = new HashMap<>();

    /**
     * Send notification to a specific user
     */
    public void sendNotificationToUser(String userId, NotificationResponse notification) {
        try {
            String destination = "/queue/notifications/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.debug("Sent notification to user: {}", userId);
        } catch (Exception e) {
            log.error("Error sending notification to user: {}", userId, e);
        }
    }

    /**
     * Broadcast notification to all users (e.g., system announcement)
     */
    public void broadcastNotification(NotificationResponse notification) {
        try {
            String destination = "/topic/notifications/broadcast";
            messagingTemplate.convertAndSend(destination, notification);
            log.debug("Broadcasted notification to all users");
        } catch (Exception e) {
            log.error("Error broadcasting notification", e);
        }
    }

    /**
     * Send notification to topic (for subscribing users)
     */
    public void sendToTopic(String topic, NotificationResponse notification) {
        try {
            String destination = "/topic/" + topic;
            messagingTemplate.convertAndSend(destination, notification);
            log.debug("Sent notification to topic: {}", topic);
        } catch (Exception e) {
            log.error("Error sending notification to topic: {}", topic, e);
        }
    }

    /**
     * Record user as active
     */
    public void recordUserActive(String userId, String sessionId) {
        activeUsers.put(userId, sessionId);
        log.debug("User {} connected with session {}", userId, sessionId);
    }

    /**
     * Record user as inactive
     */
    public void recordUserInactive(String userId) {
        activeUsers.remove(userId);
        log.debug("User {} disconnected", userId);
    }

    /**
     * Check if user is active
     */
    public boolean isUserActive(String userId) {
        return activeUsers.containsKey(userId);
    }

    /**
     * Get active users count
     */
    public int getActiveUsersCount() {
        return activeUsers.size();
    }
}
