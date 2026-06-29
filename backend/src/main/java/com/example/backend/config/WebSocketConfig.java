package com.example.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Spectator-facing live race broadcast channel. The backend only ever
 * sends on /topic/races/{raceId} (ticks relayed from Unity, then the
 * final result) — clients never publish to an application
 * destination, so no @MessageMapping handlers are registered, just
 * the broker and the handshake endpoint.
 *
 * Allowed origins mirror SecurityConfig.corsConfigurationSource()
 * (kept as a literal list there too, not read from the unused
 * app.cors.allowed-origin-patterns property — pre-existing, not
 * touched here).
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-race")
                .setAllowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*",
                        "https://*.ngrok-free.app",
                        "https://*.ngrok-free.dev",
                        "https://*.ngrok.app"
                )
                .withSockJS();
    }
}
