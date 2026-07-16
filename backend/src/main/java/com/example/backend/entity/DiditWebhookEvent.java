package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "didit_webhook_events")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DiditWebhookEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "webhook_event_id")
    private Long webhookEventId;

    @Column(name = "event_id", nullable = false, unique = true, length = 120)
    private String eventId;

    @Column(name = "provider_session_id", nullable = false, length = 100)
    private String providerSessionId;

    @Column(name = "event_type", length = 80)
    private String eventType;

    @Column(name = "provider_status", length = 50)
    private String providerStatus;

    @Column(name = "received_at", nullable = false, updatable = false)
    private LocalDateTime receivedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "processing_error", length = 500)
    private String processingError;

    @PrePersist
    void prePersist() {
        if (receivedAt == null) receivedAt = LocalDateTime.now();
    }
}
