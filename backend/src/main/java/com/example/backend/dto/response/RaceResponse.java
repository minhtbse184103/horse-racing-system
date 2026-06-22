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

    private long entryCount;
    private long availableStalls;

    private List<RacePrizeResponse> prizes;
}