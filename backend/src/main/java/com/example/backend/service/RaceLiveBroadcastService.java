package com.example.backend.service;

import com.example.backend.dto.response.RaceLiveEventMessage;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper over SimpMessagingTemplate. Every race has its own
 * STOMP topic, /topic/races/{raceId} — ticks and the final result
 * both go out on it, tagged by "type" (see RaceLiveEventMessage).
 */
@Service
public class RaceLiveBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    public RaceLiveBroadcastService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastTick(Integer raceId, Object tickPayload) {
        broadcast(raceId, "TICK", tickPayload);
    }

    public void broadcastResult(Integer raceId, Object resultPayload) {
        broadcast(raceId, "RESULT", resultPayload);
    }

    private void broadcast(Integer raceId, String type, Object data) {
        messagingTemplate.convertAndSend(
                "/topic/races/" + raceId,
                RaceLiveEventMessage.builder()
                        .type(type)
                        .raceId(raceId)
                        .data(data)
                        .build()
        );
    }
}
