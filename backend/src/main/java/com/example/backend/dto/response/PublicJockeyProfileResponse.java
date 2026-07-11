package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PublicJockeyProfileResponse {
    private Integer jockeyId;
    private String fullName;
    private String biography;
    private BigDecimal weight;
    private Integer totalRaces;
    private Integer totalWins;
    private String verificationStatus;
    private String licenceType;
    private JockeyPerformanceResponse performance;
}
