package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceRunRecoveryResponse {

    private Integer raceId;
    private String status;
    private LocalDateTime recoveredAt;
    private String reason;
}
