package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class BetSettlementResponse {

    private Integer betSettlementId;
    private Integer betEventId;
    private BigDecimal totalStake;
    private BigDecimal winningStake;
    private BigDecimal losingStake;
    private BigDecimal operatorFee;
    private BigDecimal payoutPool;
    private Integer settledBy;
    private LocalDateTime settledAt;
}
