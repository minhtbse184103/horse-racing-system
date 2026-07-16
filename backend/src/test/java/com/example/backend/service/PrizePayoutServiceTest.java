package com.example.backend.service;

import com.example.backend.constant.PrizeDistributionStatus;
import com.example.backend.constant.WalletStatus;
import com.example.backend.entity.PrizeDistribution;
import com.example.backend.entity.Race;
import com.example.backend.entity.TournamentFund;
import com.example.backend.entity.Wallet;
import com.example.backend.repository.PrizeDistributionRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.TournamentFundRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrizePayoutServiceTest {

    @Mock private PrizeDistributionRepository distributionRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private TournamentFundRepository tournamentFundRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private FundAccountingService fundAccountingService;

    private PrizePayoutService service;

    @BeforeEach
    void setUp() {
        service = new PrizePayoutService(
                distributionRepository,
                raceRepository,
                tournamentFundRepository,
                walletRepository,
                walletTransactionRepository,
                fundAccountingService
        );
    }

    @Test
    void paysOwnerAndJockeyAndDebitsTournamentFundAtomically() {
        PrizeDistribution distribution = distribution();
        Race race = race();
        TournamentFund fund = fund();
        Wallet ownerWallet = wallet(11, 101);
        Wallet jockeyWallet = wallet(12, 202);

        when(distributionRepository.findByIdForUpdate(7)).thenReturn(Optional.of(distribution));
        when(raceRepository.findById(3)).thenReturn(Optional.of(race));
        when(tournamentFundRepository.findByTournamentIdForUpdate(9)).thenReturn(Optional.of(fund));
        when(walletRepository.findByUserIdForUpdate(101)).thenReturn(Optional.of(ownerWallet));
        when(walletRepository.findByUserIdForUpdate(202)).thenReturn(Optional.of(jockeyWallet));

        assertTrue(service.payIfPossible(7));

        assertEquals(new BigDecimal("700.00"), ownerWallet.getBalance());
        assertEquals(new BigDecimal("300.00"), jockeyWallet.getBalance());
        assertEquals(new BigDecimal("4000.00"), fund.getAvailableBalance());
        assertEquals(new BigDecimal("1000.00"), fund.getPaidPrizeAmount());
        assertEquals(PrizeDistributionStatus.PAID, distribution.getStatus());
        verify(walletTransactionRepository, org.mockito.Mockito.times(2)).save(any());
        verify(fundAccountingService).createPrizeDebit(fund, 7, new BigDecimal("1000.00"));
    }

    @Test
    void keepsPrizePendingWhenRecipientWalletIsMissing() {
        PrizeDistribution distribution = distribution();
        TournamentFund fund = fund();

        when(distributionRepository.findByIdForUpdate(7)).thenReturn(Optional.of(distribution));
        when(raceRepository.findById(3)).thenReturn(Optional.of(race()));
        when(tournamentFundRepository.findByTournamentIdForUpdate(9)).thenReturn(Optional.of(fund));
        when(walletRepository.findByUserIdForUpdate(101)).thenReturn(Optional.of(wallet(11, 101)));
        when(walletRepository.findByUserIdForUpdate(202)).thenReturn(Optional.empty());

        assertFalse(service.payIfPossible(7));

        assertEquals(PrizeDistributionStatus.PENDING, distribution.getStatus());
        assertEquals(new BigDecimal("5000.00"), fund.getAvailableBalance());
        verify(walletTransactionRepository, never()).save(any());
        verify(fundAccountingService, never()).createPrizeDebit(any(), any(), any());
    }

    private PrizeDistribution distribution() {
        PrizeDistribution distribution = new PrizeDistribution();
        distribution.setPrizeDistributionId(7);
        distribution.setRaceId(3);
        distribution.setOwnerId(101);
        distribution.setJockeyId(202);
        distribution.setTotalPrize(new BigDecimal("1000.00"));
        distribution.setOwnerAmount(new BigDecimal("700.00"));
        distribution.setJockeyAmount(new BigDecimal("300.00"));
        distribution.setStatus(PrizeDistributionStatus.PENDING);
        return distribution;
    }

    private Race race() {
        Race race = new Race();
        race.setRaceId(3);
        race.setTournamentId(9);
        return race;
    }

    private TournamentFund fund() {
        TournamentFund fund = new TournamentFund();
        fund.setTournamentId(9);
        fund.setCollectedAmount(new BigDecimal("5000.00"));
        fund.setPaidPrizeAmount(BigDecimal.ZERO.setScale(2));
        fund.setAvailableBalance(new BigDecimal("5000.00"));
        return fund;
    }

    private Wallet wallet(Integer walletId, Integer userId) {
        Wallet wallet = new Wallet();
        wallet.setWalletId(walletId);
        wallet.setUserId(userId);
        wallet.setBalance(BigDecimal.ZERO.setScale(2));
        wallet.setLockedBalance(BigDecimal.ZERO.setScale(2));
        wallet.setStatus(WalletStatus.ACTIVE);
        return wallet;
    }
}
