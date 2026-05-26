package com.group.mock.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler, NotificationWebSocketHandler notificationWebSocketHandler) {
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.notificationWebSocketHandler = notificationWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Chat WebSocket endpoint
        registry.addHandler(chatWebSocketHandler, "/ws")
                .setAllowedOrigins("*");
                
        // Notification WebSocket endpoint
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .setAllowedOrigins("*");
    }
}
