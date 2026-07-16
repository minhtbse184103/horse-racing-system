package com.example.backend.service;

import com.example.backend.constant.PrizeDistributionStatus;
import com.example.backend.constant.WalletReferenceType;
import com.example.backend.constant.WalletStatus;
import com.example.backend.constant.WalletTransactionType;
import com.example.backend.entity.PrizeDistribution;
import com.example.backend.entity.Race;
import com.example.backend.entity.TournamentFund;
import com.example.backend.entity.Wallet;
import com.example.backend.entity.WalletTransaction;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.PrizeDistributionRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.TournamentFundRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrizePayoutService {

    private final PrizeDistributionRepository distributionRepository;
    private final RaceRepository raceRepository;
    private final TournamentFundRepository tournamentFundRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final FundAccountingService fundAccountingService;

    @Transactional
    public boolean payIfPossible(Integer distributionId) {
        PrizeDistribution distribution = distributionRepository.findByIdForUpdate(distributionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Prize distribution does not exist."));
        if (PrizeDistributionStatus.PAID.equals(distribution.getStatus())) return true;
        if (!PrizeDistributionStatus.PENDING.equals(distribution.getStatus())
                && !PrizeDistributionStatus.FAILED.equals(distribution.getStatus())) return false;

        Race race = raceRepository.findById(distribution.getRaceId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Prize race does not exist."));
        TournamentFund fund = tournamentFundRepository.findByTournamentIdForUpdate(race.getTournamentId())
                .orElse(null);
        if (fund == null || fund.getAvailableBalance().compareTo(distribution.getTotalPrize()) < 0) return false;

        Wallet ownerWallet = walletRepository.findByUserIdForUpdate(distribution.getOwnerId()).orElse(null);
        Wallet jockeyWallet = walletRepository.findByUserIdForUpdate(distribution.getJockeyId()).orElse(null);
        if (!isActive(ownerWallet) || !isActive(jockeyWallet)) return false;

        creditWallet(ownerWallet, distribution.getOwnerAmount(), distribution.getPrizeDistributionId(), "Owner race prize payout");
        creditWallet(jockeyWallet, distribution.getJockeyAmount(), distribution.getPrizeDistributionId(), "Jockey race prize payout");

        fund.setAvailableBalance(fund.getAvailableBalance().subtract(distribution.getTotalPrize()));
        fund.setPaidPrizeAmount(fund.getPaidPrizeAmount().add(distribution.getTotalPrize()));
        tournamentFundRepository.save(fund);
        fundAccountingService.createPrizeDebit(fund, distribution.getPrizeDistributionId(), distribution.getTotalPrize());

        distribution.setStatus(PrizeDistributionStatus.PAID);
        distribution.setDistributedAt(LocalDateTime.now());
        distributionRepository.save(distribution);
        return true;
    }

    @Transactional
    public void payPendingForUser(Integer userId) {
        distributionRepository.findPayableByUserId(
                        userId,
                        List.of(PrizeDistributionStatus.PENDING, PrizeDistributionStatus.FAILED)
                )
                .forEach(distribution -> payIfPossible(distribution.getPrizeDistributionId()));
    }

    private void creditWallet(Wallet wallet, BigDecimal amount, Integer distributionId, String description) {
        if (amount == null || amount.signum() == 0) return;
        BigDecimal balanceBefore = valueOrZero(wallet.getBalance());
        BigDecimal lockedBalance = valueOrZero(wallet.getLockedBalance());
        BigDecimal balanceAfter = balanceBefore.add(amount);
        wallet.setBalance(balanceAfter);
        walletRepository.save(wallet);

        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(wallet.getWalletId());
        transaction.setUserId(wallet.getUserId());
        transaction.setType(WalletTransactionType.PRIZE_PAYOUT);
        transaction.setAmount(amount);
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(balanceAfter);
        transaction.setLockedBefore(lockedBalance);
        transaction.setLockedAfter(lockedBalance);
        transaction.setReferenceType(WalletReferenceType.PRIZE_DISTRIBUTION);
        transaction.setReferenceId(distributionId);
        transaction.setDescription(description);
        walletTransactionRepository.save(transaction);
    }

    private boolean isActive(Wallet wallet) {
        return wallet != null && WalletStatus.ACTIVE.equals(wallet.getStatus());
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
