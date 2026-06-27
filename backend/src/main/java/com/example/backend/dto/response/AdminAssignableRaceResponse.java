package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminAssignableRaceResponse {

    private Integer raceId;
    private Integer tournamentId;
    private String tournamentName;

    private String raceName;
    private String trackName;

    private LocalDateTime raceStartTime;
    private LocalDateTime raceEndTime;

    private Integer distance;
    private Integer maxRunners;
    private Integer raceOrder;
    private String status;
}
