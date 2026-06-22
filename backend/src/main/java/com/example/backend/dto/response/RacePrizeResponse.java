package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class RacePrizeResponse {

    private Integer racePrizeId;
    private Integer raceId;
    private Integer rankPosition;
    private BigDecimal amount;
    private BigDecimal ownerPercent;
    private BigDecimal jockeyPercent;
}
