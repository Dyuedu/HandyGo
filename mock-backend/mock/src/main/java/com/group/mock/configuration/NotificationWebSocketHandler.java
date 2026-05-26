package com.group.mock.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.group.mock.entity.DTO.response.NotificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class NotificationWebSocketHandler extends TextWebSocketHandler {
    
    private final ObjectMapper objectMapper;
    
    // Store active user connections mapping userId -> WebSocketSession
    private static final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    public NotificationWebSocketHandler() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("Notification WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            JsonNode payload = objectMapper.readTree(message.getPayload());
            if (payload.has("action") && "SUBSCRIBE".equals(payload.get("action").asText())) {
                String target = payload.get("target").asText();
                // target format: /queue/notifications/{userId}
                String[] parts = target.split("/");
                if (parts.length > 3) {
                    String userId = parts[3];
                    session.getAttributes().put("userId", userId);
                    userSessions.put(userId, session);
                    log.info("User {} subscribed to notifications on session {}", userId, session.getId());
                }
            }
        } catch (Exception e) {
            log.error("Error processing Notification WebSocket message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = (String) session.getAttributes().get("userId");
        if (userId != null) {
            userSessions.remove(userId);
            log.info("Notification WebSocket connection closed for user: {}", userId);
        }
    }

    /**
     * Send notification to a specific user
     */
    public void sendNotificationToUser(String userId, NotificationResponse notification) {
        try {
            WebSocketSession session = userSessions.get(userId);
            if (session != null && session.isOpen()) {
                String jsonResponse = objectMapper.writeValueAsString(notification);
                session.sendMessage(new TextMessage(jsonResponse));
                log.debug("Sent notification to user: {}", userId);
            }
        } catch (Exception e) {
            log.error("Error sending notification to user: {}", userId, e);
        }
    }

    /**
     * Broadcast notification to all users (e.g., system announcement)
     */
    public void broadcastNotification(NotificationResponse notification) {
        try {
            String jsonResponse = objectMapper.writeValueAsString(notification);
            TextMessage message = new TextMessage(jsonResponse);
            for (WebSocketSession session : userSessions.values()) {
                if (session.isOpen()) {
                    session.sendMessage(message);
                }
            }
            log.debug("Broadcasted notification to all users");
        } catch (Exception e) {
            log.error("Error broadcasting notification", e);
        }
    }
}
