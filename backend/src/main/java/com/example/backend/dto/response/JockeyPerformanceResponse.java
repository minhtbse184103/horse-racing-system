package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class JockeyPerformanceResponse {
    private Integer jockeyId;
    private Integer totalRaces;
    private Integer top1Count;
    private Integer top2Count;
    private Integer top3Count;
    private BigDecimal winRate;
    private Integer violationCount;
    private Integer disqualifiedCount;
    private LocalDateTime lastUpdatedAt;
}
