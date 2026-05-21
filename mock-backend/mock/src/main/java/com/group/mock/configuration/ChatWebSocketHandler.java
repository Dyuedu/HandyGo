package com.group.mock.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.group.mock.entity.Account;
import com.group.mock.entity.Message;
import com.group.mock.repository.AccountRepository;
import com.group.mock.repository.MessageRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final AccountRepository accountRepository;
    private final MessageRepository messageRepository;
    private final JwtDecoder jwtDecoder;
    private final ObjectMapper objectMapper;

    // Stores sessions mapped by userId
    private static final Map<UUID, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(
            AccountRepository accountRepository,
            MessageRepository messageRepository,
            JwtDecoder jwtDecoder) {
        this.accountRepository = accountRepository;
        this.messageRepository = messageRepository;
        this.jwtDecoder = jwtDecoder;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule()); // Support LocalDateTime serialization
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID userId = extractUserId(session);
        if (userId == null) {
            log.warn("WebSocket connection rejected: Invalid or missing authentication");
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        session.getAttributes().put("userId", userId);
        userSessions.put(userId, session);
        log.info("WebSocket connection established for user: {}", userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID senderId = (UUID) session.getAttributes().get("userId");
        if (senderId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        try {
            // Parse incoming message payload
            IncomingMessagePayload payload = objectMapper.readValue(message.getPayload(), IncomingMessagePayload.class);
            if (payload.getReceiverId() == null || payload.getContent() == null) {
                log.warn("WebSocket message dropped: Missing receiverId or content");
                return;
            }

            // Save message to database
            Message chatMessage = new Message();
            chatMessage.setSenderId(senderId);
            chatMessage.setReceiverId(payload.getReceiverId());
            chatMessage.setContent(payload.getContent());
            chatMessage.setMessageType(payload.getMessageType() != null ? payload.getMessageType() : "TEXT");
            chatMessage.setSentAt(LocalDateTime.now());

            Message savedMessage = messageRepository.save(chatMessage);
            String jsonResponse = objectMapper.writeValueAsString(savedMessage);

            // 1. Send confirmation back to the sender
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(jsonResponse));
            }

            // 2. Relay the message to the receiver if they are online
            WebSocketSession receiverSession = userSessions.get(payload.getReceiverId());
            if (receiverSession != null && receiverSession.isOpen()) {
                receiverSession.sendMessage(new TextMessage(jsonResponse));
            }

        } catch (Exception e) {
            log.error("Error processing WebSocket message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        UUID userId = (UUID) session.getAttributes().get("userId");
        if (userId != null) {
            userSessions.remove(userId);
            log.info("WebSocket connection closed for user: {}", userId);
        }
    }

    public static void broadcastMessageToUsers(Message message) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(message);

            // Send to sender
            WebSocketSession senderSession = userSessions.get(message.getSenderId());
            if (senderSession != null && senderSession.isOpen()) {
                senderSession.sendMessage(new TextMessage(json));
            }

            // Send to receiver
            WebSocketSession receiverSession = userSessions.get(message.getReceiverId());
            if (receiverSession != null && receiverSession.isOpen()) {
                receiverSession.sendMessage(new TextMessage(json));
            }
        } catch (Exception e) {
            log.error("Failed to broadcast message via WebSocket", e);
        }
    }

    private UUID extractUserId(WebSocketSession session) {
        try {
            String query = session.getUri().getQuery();
            if (query == null || query.isBlank()) {
                return null;
            }

            String token = null;
            String[] params = query.split("&");
            for (String param : params) {
                String[] keyValue = param.split("=");
                if (keyValue.length == 2 && "token".equals(keyValue[0])) {
                    token = keyValue[1];
                    break;
                }
            }

            if (token == null || token.isBlank()) {
                // Check if a direct userId is passed as a development fallback
                for (String param : params) {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2 && "userId".equals(keyValue[0])) {
                        return UUID.fromString(keyValue[1]);
                    }
                }
                return null;
            }

            // Decode and validate token
            Jwt jwt = jwtDecoder.decode(token);
            String username = jwt.getSubject();
            
            return accountRepository.findByUsername(username)
                    .map(Account::getId)
                    .orElse(null);

        } catch (Exception e) {
            log.warn("Failed to extract user ID from WebSocket session: {}", e.getMessage());
            return null;
        }
    }

    // Helper static class to parse incoming WebSocket message
    @lombok.Data
    private static class IncomingMessagePayload {
        private UUID receiverId;
        private String content;
        private String messageType;
    }
}
