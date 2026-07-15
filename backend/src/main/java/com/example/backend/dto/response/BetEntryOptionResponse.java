package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class BetEntryOptionResponse {

    private Integer raceEntryId;
    private Integer startingStall;
    private Integer horseId;
    private String horseName;
    private Integer ownerId;
    private String ownerName;
    private Integer jockeyId;
    private String jockeyName;
    private BigDecimal poolStake;
    private BigDecimal estimatedOdds;
}
