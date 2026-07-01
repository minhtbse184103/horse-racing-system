package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class RaceResponse {

    private Integer raceId;
    private Integer tournamentId;

    private String raceName;
    private String trackName;

    private LocalDateTime raceStartTime;
    private LocalDateTime raceEndTime;

    private Integer distance;
    private Integer maxRunners;
    private Integer raceOrder;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Set once RaceEngineLaunchService launches the Unity process; null
    // means the race hasn't been run yet even if status is IN_PROGRESS
    // (status flips to READY once raceStartTime passes, which can
    // happen before an admin actually clicks "Run Race").
    private LocalDateTime runStartedAt;
    private boolean runStuck;
    private long runElapsedMinutes;
    private long runWatchdogTimeoutMinutes;

    private long entryCount;
    private long availableStalls;

    private List<RacePrizeResponse> prizes;
}
