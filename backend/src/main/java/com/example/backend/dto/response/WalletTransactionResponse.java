package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class WalletTransactionResponse {

    private Integer walletTransactionId;
    private Integer walletId;
    private Integer userId;
    private String type;
    private BigDecimal amount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private BigDecimal lockedBefore;
    private BigDecimal lockedAfter;
    private String referenceType;
    private Integer referenceId;
    private String description;
    private LocalDateTime createdAt;
}
