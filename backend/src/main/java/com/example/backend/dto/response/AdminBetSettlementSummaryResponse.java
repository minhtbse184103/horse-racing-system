package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminBetSettlementSummaryResponse {
    private Integer betSettlementId;
    private Integer betEventId;
    private Integer raceId;
    private String raceName;
    private String trackName;
    private LocalDateTime raceStartTime;
    private Integer betProductId;
    private String productCode;
    private String productName;
    private String eventStatus;
    private BigDecimal totalStake;
    private BigDecimal winningStake;
    private BigDecimal losingStake;
    private BigDecimal operatorFee;
    private BigDecimal payoutPool;
    private Integer settledBy;
    private String settledByName;
    private LocalDateTime settledAt;
}
