package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AdminFinanceOverviewResponse {
    private BigDecimal systemBalance;
    private BigDecimal bettingFeeRevenue;
    private BigDecimal totalTournamentFunds;
    private BigDecimal pendingPrizeAmount;
    private long pendingPrizeCount;
    private List<TournamentFundItem> tournamentFunds;
    private List<PrizeDistributionItem> pendingPrizes;
    private List<FundTransactionItem> recentTransactions;

    @Data
    @Builder
    public static class TournamentFundItem {
        private Integer tournamentId;
        private String tournamentName;
        private BigDecimal collectedAmount;
        private BigDecimal paidPrizeAmount;
        private BigDecimal availableBalance;
    }

    @Data
    @Builder
    public static class PrizeDistributionItem {
        private Integer prizeDistributionId;
        private Integer raceId;
        private Integer ownerId;
        private Integer jockeyId;
        private BigDecimal totalPrize;
        private BigDecimal ownerAmount;
        private BigDecimal jockeyAmount;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime distributedAt;
    }

    @Data
    @Builder
    public static class FundTransactionItem {
        private Long fundTransactionId;
        private String fundKey;
        private Integer tournamentId;
        private String transactionType;
        private String direction;
        private BigDecimal amount;
        private BigDecimal balanceAfter;
        private String description;
        private LocalDateTime createdAt;
    }
}
