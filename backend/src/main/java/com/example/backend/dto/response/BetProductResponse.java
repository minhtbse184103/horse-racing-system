package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class BetProductResponse {

    private Integer betProductId;
    private String code;
    private String name;
    private String description;
    private BigDecimal minStake;
    private BigDecimal maxDailyStake;
    private BigDecimal operatorFeeRate;
    private BigDecimal minimumOdds;
    private Boolean active;
}
