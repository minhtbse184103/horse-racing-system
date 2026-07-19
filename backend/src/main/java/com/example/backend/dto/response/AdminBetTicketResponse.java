package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminBetTicketResponse {
    private Integer betTicketId;
    private Integer betEventId;
    private Integer bettorId;
    private String bettorName;
    private String bettorEmail;
    private Integer raceId;
    private String raceName;
    private Integer raceEntryId;
    private Integer startingStall;
    private Integer horseId;
    private String horseName;
    private Integer ownerId;
    private String ownerName;
    private Integer jockeyId;
    private String jockeyName;
    private BigDecimal stake;
    private BigDecimal estimatedOddsAtBet;
    private BigDecimal finalOdds;
    private BigDecimal payoutAmount;
    private String status;
    private LocalDateTime placedAt;
    private LocalDateTime settledAt;
}
