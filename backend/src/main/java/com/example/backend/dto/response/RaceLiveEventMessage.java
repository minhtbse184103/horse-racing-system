package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

/**
 * Envelope broadcast on /topic/races/{raceId}. "type" lets spectator
 * clients tell a position tick apart from the final result on the
 * same subscription, without needing two topics.
 */
@Getter
@Builder
public class RaceLiveEventMessage {

    private String type;
    private Integer raceId;
    private Object data;
}
