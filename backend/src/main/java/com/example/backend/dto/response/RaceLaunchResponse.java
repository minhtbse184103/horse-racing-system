package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceLaunchResponse {

    private Integer raceId;
    private String status;
    private LocalDateTime launchedAt;
    private String raceEngineToken;
}
