package com.example.backend.dto.response;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JockeyProfileResponse {
    private Integer jockeyId;
    private String fullName;
    private String email;
    private BigDecimal weight;
    private String ranking;
    private String biography;
    private Integer totalRaces;
    private Integer totalWins;
}
