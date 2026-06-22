package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class TournamentConditionResponse {

    private Integer conditionId;
    private String conditionType;
    private String operator;
    private String value;
    private BigDecimal minValue;
    private BigDecimal maxValue;
}