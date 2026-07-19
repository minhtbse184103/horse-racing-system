package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminMoneyTransactionResponse {
    private String id;
    private String source;
    private String transactionType;
    private String direction;
    private BigDecimal amount;
    private String currency;
    private String status;
    private Integer userId;
    private String username;
    private Integer tournamentId;
    private String tournamentName;
    private Integer raceId;
    private String raceName;
    private String referenceType;
    private Integer referenceId;
    private String description;
    private LocalDateTime createdAt;
}
