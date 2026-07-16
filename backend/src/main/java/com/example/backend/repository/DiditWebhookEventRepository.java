package com.example.backend.repository;

import com.example.backend.entity.DiditWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DiditWebhookEventRepository extends JpaRepository<DiditWebhookEvent, Long> {
    boolean existsByEventId(String eventId);

    Optional<DiditWebhookEvent> findByEventId(String eventId);

    @Modifying
    @Query(value = """
            insert ignore into didit_webhook_events
              (event_id, provider_session_id, event_type, provider_status, received_at)
            values (:eventId, :sessionId, :eventType, :providerStatus, now())
            """, nativeQuery = true)
    int insertIfAbsent(@Param("eventId") String eventId,
                       @Param("sessionId") String sessionId,
                       @Param("eventType") String eventType,
                       @Param("providerStatus") String providerStatus);
}
