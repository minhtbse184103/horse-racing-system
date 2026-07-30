package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminBettingEligibleRaceResponse {

    private Integer raceId;
    private String raceName;
    private String trackName;
    private LocalDateTime raceStartTime;
    private String status;
}
