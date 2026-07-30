package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminSystemWalletResponse {

    private Integer systemFundId;
    private BigDecimal balance;
    private BigDecimal bettingFeeRevenue;
    private BigDecimal minusPoolSubsidyPaid;
    private String currency;
    private LocalDateTime updatedAt;
    private List<SystemFundTransactionResponse> transactions;

    @Getter
    @Builder
    public static class SystemFundTransactionResponse {
        private Long fundTransactionId;
        private String transactionType;
        private String direction;
        private BigDecimal amount;
        private BigDecimal balanceBefore;
        private BigDecimal balanceAfter;
        private String referenceType;
        private Integer referenceId;
        private String description;
        private LocalDateTime createdAt;
    }
}
