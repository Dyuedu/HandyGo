package com.group.mock.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler) {
        this.chatWebSocketHandler = chatWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Chat WebSocket endpoint
        registry.addHandler(chatWebSocketHandler, "/ws")
                .setAllowedOrigins("*");
    }

    /**
     * STOMP WebSocket configuration for real-time notifications
     */
    @Configuration
    @EnableWebSocketMessageBroker
    public static class StompWebSocketConfig implements WebSocketMessageBrokerConfigurer {

        @Override
        public void configureMessageBroker(MessageBrokerRegistry config) {
            // Enable simple in-memory broker
            config.enableSimpleBroker("/topic", "/queue");
            
            // Set the prefix for destinations where the client sends data to
            config.setApplicationDestinationPrefixes("/app");
        }

        @Override
        public void registerStompEndpoints(StompEndpointRegistry registry) {
            // Register the endpoint where clients will connect for notifications
            registry.addEndpoint("/ws/notifications")
                .setAllowedOrigins("*")
                .withSockJS();
            
            // Alternative: without SockJS (pure WebSocket)
            registry.addEndpoint("/ws/notifications/stomp")
                .setAllowedOrigins("*");
        }
    }
}
