package com.example.backend.service;

import com.example.backend.constant.FundTransactionType;
import com.example.backend.constant.WalletReferenceType;
import com.example.backend.entity.BetSettlement;
import com.example.backend.entity.FundTransaction;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.entity.Registration;
import com.example.backend.entity.SystemFund;
import com.example.backend.entity.TournamentFund;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.FundTransactionRepository;
import com.example.backend.repository.SystemFundRepository;
import com.example.backend.repository.TournamentFundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class FundAccountingService {

    private static final String SYSTEM_FUND_KEY = "SYSTEM";

    private final TournamentFundRepository tournamentFundRepository;
    private final SystemFundRepository systemFundRepository;
    private final FundTransactionRepository fundTransactionRepository;

    @Transactional
    public void recordRegistrationFee(PaymentTransaction payment, Registration registration) {
        BigDecimal amount = money(payment.getAmount());
        tournamentFundRepository.creditRegistrationFee(registration.getTournamentId(), amount);
        TournamentFund fund = tournamentFundRepository.findByTournamentIdForUpdate(registration.getTournamentId())
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Tournament fund was not created."));

        FundTransaction transaction = baseTransaction(
                tournamentFundKey(registration.getTournamentId()),
                registration.getTournamentId(),
                FundTransactionType.REGISTRATION_FEE,
                "CREDIT",
                amount,
                WalletReferenceType.PAYMENT_TRANSACTION,
                payment.getPaymentTransactionId(),
                "Tournament registration fee " + registration.getRegistrationNo()
        );
        transaction.setBalanceAfter(fund.getAvailableBalance());
        transaction.setBalanceBefore(fund.getAvailableBalance().subtract(amount));
        fundTransactionRepository.save(transaction);
    }

    @Transactional
    public void recordBettingOperatorFee(BetSettlement settlement) {
        BigDecimal amount = money(settlement.getOperatorFee());
        if (amount.signum() == 0) return;

        systemFundRepository.creditBettingFee(amount);
        SystemFund fund = systemFundRepository.findById(SystemFund.SINGLETON_ID)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "System fund was not created."));

        FundTransaction transaction = baseTransaction(
                SYSTEM_FUND_KEY,
                null,
                FundTransactionType.BETTING_OPERATOR_FEE,
                "CREDIT",
                amount,
                WalletReferenceType.BET_SETTLEMENT,
                settlement.getBetSettlementId(),
                "Betting operator fee"
        );
        transaction.setBalanceAfter(fund.getBalance());
        transaction.setBalanceBefore(fund.getBalance().subtract(amount));
        fundTransactionRepository.save(transaction);
    }

    public FundTransaction createPrizeDebit(
            TournamentFund fund,
            Integer distributionId,
            BigDecimal amount
    ) {
        FundTransaction transaction = baseTransaction(
                tournamentFundKey(fund.getTournamentId()),
                fund.getTournamentId(),
                FundTransactionType.PRIZE_PAYOUT,
                "DEBIT",
                amount,
                WalletReferenceType.PRIZE_DISTRIBUTION,
                distributionId,
                "Owner and jockey race prize payout"
        );
        transaction.setBalanceBefore(fund.getAvailableBalance().add(amount));
        transaction.setBalanceAfter(fund.getAvailableBalance());
        return fundTransactionRepository.save(transaction);
    }

    private FundTransaction baseTransaction(
            String fundKey,
            Integer tournamentId,
            String type,
            String direction,
            BigDecimal amount,
            String referenceType,
            Integer referenceId,
            String description
    ) {
        FundTransaction transaction = new FundTransaction();
        transaction.setFundKey(fundKey);
        transaction.setTournamentId(tournamentId);
        transaction.setTransactionType(type);
        transaction.setDirection(direction);
        transaction.setAmount(amount);
        transaction.setReferenceType(referenceType);
        transaction.setReferenceId(referenceId);
        transaction.setDescription(description);
        return transaction;
    }

    private String tournamentFundKey(Integer tournamentId) {
        return "TOURNAMENT:" + tournamentId;
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value.setScale(2);
    }
}
