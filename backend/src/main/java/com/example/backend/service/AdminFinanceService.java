package com.example.backend.service;

import com.example.backend.constant.PrizeDistributionStatus;
import com.example.backend.dto.response.AdminFinanceOverviewResponse;
import com.example.backend.entity.FundTransaction;
import com.example.backend.entity.PrizeDistribution;
import com.example.backend.entity.SystemFund;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentFund;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.FundTransactionRepository;
import com.example.backend.repository.PrizeDistributionRepository;
import com.example.backend.repository.SystemFundRepository;
import com.example.backend.repository.TournamentFundRepository;
import com.example.backend.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminFinanceService {

    private final SystemFundRepository systemFundRepository;
    private final TournamentFundRepository tournamentFundRepository;
    private final TournamentRepository tournamentRepository;
    private final PrizeDistributionRepository distributionRepository;
    private final FundTransactionRepository transactionRepository;
    private final PrizePayoutService prizePayoutService;

    @Transactional(readOnly = true)
    public AdminFinanceOverviewResponse getOverview() {
        SystemFund systemFund = systemFundRepository.findById(SystemFund.SINGLETON_ID).orElse(null);
        List<TournamentFund> tournamentFunds = tournamentFundRepository.findAll();
        Map<Integer, Tournament> tournaments = tournamentRepository.findAllById(
                        tournamentFunds.stream().map(TournamentFund::getTournamentId).toList()
                ).stream()
                .collect(Collectors.toMap(Tournament::getTournamentId, Function.identity()));
        List<PrizeDistribution> pending = distributionRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(PrizeDistributionStatus.PENDING, PrizeDistributionStatus.FAILED)
        );

        return AdminFinanceOverviewResponse.builder()
                .systemBalance(systemFund == null ? BigDecimal.ZERO : systemFund.getBalance())
                .bettingFeeRevenue(systemFund == null ? BigDecimal.ZERO : systemFund.getBettingFeeRevenue())
                .totalTournamentFunds(tournamentFunds.stream()
                        .map(TournamentFund::getAvailableBalance).reduce(BigDecimal.ZERO, BigDecimal::add))
                .pendingPrizeAmount(pending.stream()
                        .map(PrizeDistribution::getTotalPrize).reduce(BigDecimal.ZERO, BigDecimal::add))
                .pendingPrizeCount(pending.size())
                .tournamentFunds(tournamentFunds.stream()
                        .map(fund -> toTournamentFund(fund, tournaments.get(fund.getTournamentId())))
                        .toList())
                .pendingPrizes(pending.stream().map(this::toPrize).toList())
                .recentTransactions(transactionRepository.findTop50ByOrderByCreatedAtDesc()
                        .stream().map(this::toTransaction).toList())
                .build();
    }

    @Transactional
    public AdminFinanceOverviewResponse.PrizeDistributionItem retryPrize(Integer distributionId) {
        if (!prizePayoutService.payIfPossible(distributionId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Prize payout requires enough tournament funds and active Owner/Jockey wallets."
            );
        }
        return distributionRepository.findById(distributionId)
                .map(this::toPrize)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Prize distribution does not exist."));
    }

    private AdminFinanceOverviewResponse.TournamentFundItem toTournamentFund(
            TournamentFund fund,
            Tournament tournament
    ) {
        return AdminFinanceOverviewResponse.TournamentFundItem.builder()
                .tournamentId(fund.getTournamentId())
                .tournamentName(tournament == null ? "Tournament #" + fund.getTournamentId() : tournament.getTournamentName())
                .collectedAmount(fund.getCollectedAmount())
                .paidPrizeAmount(fund.getPaidPrizeAmount())
                .availableBalance(fund.getAvailableBalance())
                .build();
    }

    private AdminFinanceOverviewResponse.PrizeDistributionItem toPrize(PrizeDistribution distribution) {
        return AdminFinanceOverviewResponse.PrizeDistributionItem.builder()
                .prizeDistributionId(distribution.getPrizeDistributionId())
                .raceId(distribution.getRaceId())
                .ownerId(distribution.getOwnerId())
                .jockeyId(distribution.getJockeyId())
                .totalPrize(distribution.getTotalPrize())
                .ownerAmount(distribution.getOwnerAmount())
                .jockeyAmount(distribution.getJockeyAmount())
                .status(distribution.getStatus())
                .createdAt(distribution.getCreatedAt())
                .distributedAt(distribution.getDistributedAt())
                .build();
    }

    private AdminFinanceOverviewResponse.FundTransactionItem toTransaction(FundTransaction transaction) {
        return AdminFinanceOverviewResponse.FundTransactionItem.builder()
                .fundTransactionId(transaction.getFundTransactionId())
                .fundKey(transaction.getFundKey())
                .tournamentId(transaction.getTournamentId())
                .transactionType(transaction.getTransactionType())
                .direction(transaction.getDirection())
                .amount(transaction.getAmount())
                .balanceAfter(transaction.getBalanceAfter())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
