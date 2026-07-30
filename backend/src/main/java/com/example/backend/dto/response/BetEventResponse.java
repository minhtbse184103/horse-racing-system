package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class BetEventResponse {

    private Integer betEventId;
    private Integer raceId;
    private String raceName;
    private String trackName;
    private LocalDateTime raceStartTime;
    private Integer betProductId;
    private String productCode;
    private String productName;
    private String status;
    private LocalDateTime openAt;
    private LocalDateTime closeAt;
    private BigDecimal minStake;
    private BigDecimal maxDailyStake;
    private BigDecimal operatorFeeRate;
    private BigDecimal totalStake;
    private BigDecimal raceTotalStake;
    private List<BetEntryOptionResponse> entries;
}
