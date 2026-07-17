package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class BetTicketResponse {

    private Integer betTicketId;
    private Integer betEventId;
    private String betEventStatus;
    private LocalDateTime bettingCloseAt;
    private Integer raceId;
    private String raceName;
    private String productCode;
    private String productName;
    private Integer raceEntryId;
    private Integer startingStall;
    private String horseName;
    private BigDecimal stake;
    private BigDecimal estimatedOddsAtBet;
    private BigDecimal finalOdds;
    private BigDecimal payoutAmount;
    private String status;
    private LocalDateTime placedAt;
    private LocalDateTime settledAt;
}
