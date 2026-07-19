package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
// Response DTO for official race results and their configured display-only prizeMoney.
public class RaceResultPrizeResponse {

    private Integer resultId;
    private Integer raceEntryId;
    private Integer startingStall;
    private Integer finishPosition;
    private String finishTime;
    private BigDecimal prizeMoney;
    private LocalDateTime recordedAt;
    private Integer horseId;
    private String horseName;
    private Integer ownerId;
    private String ownerName;
    private Integer jockeyId;
    private String jockeyName;
}
