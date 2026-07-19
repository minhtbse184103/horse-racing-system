package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
// FLOW: Prize Split Display
// ORDER: 6A/7 - DTO carries official result fields plus owner/jockey split amounts back to the dialog.
// Response DTO for the official result/prize dialog, including owner and jockey prize split fields.
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
    private Integer prizeDistributionId;
    private BigDecimal totalPrize;
    private BigDecimal ownerAmount;
    private BigDecimal jockeyAmount;
    private String distributionStatus;
}
