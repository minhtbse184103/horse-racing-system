package com.example.backend.service;

import com.example.backend.constant.BetEventStatus;
import com.example.backend.constant.BetTicketStatus;
import com.example.backend.entity.BetEvent;
import com.example.backend.entity.BetProduct;
import com.example.backend.entity.BetSettlement;
import com.example.backend.entity.BetTicket;
import com.example.backend.entity.RaceResult;
import com.example.backend.entity.Wallet;
import com.example.backend.repository.BetEventRepository;
import com.example.backend.repository.BetProductRepository;
import com.example.backend.repository.BetSettlementRepository;
import com.example.backend.repository.BetTicketRepository;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.UserVerificationRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BettingServiceSettlementTest {

    private static final int EVENT_ID = 1;
    private static final int RACE_ID = 2;
    private static final int PRODUCT_ID = 3;
    private static final int ADMIN_ID = 4;
    private static final int WINNER_ENTRY_ID = 10;
    private static final int LOSER_ENTRY_ID = 11;

    @Mock private BetProductRepository betProductRepository;
    @Mock private BetEventRepository betEventRepository;
    @Mock private BetTicketRepository betTicketRepository;
    @Mock private BetSettlementRepository betSettlementRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private RaceEntryRepository raceEntryRepository;
    @Mock private RaceResultRepository raceResultRepository;
    @Mock private RegistrationRepository registrationRepository;
    @Mock private HorseRepository horseRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserVerificationRepository userVerificationRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private FundAccountingService fundAccountingService;

    private BettingService service;

    @BeforeEach
    void setUp() {
        service = new BettingService(
                betProductRepository,
                betEventRepository,
                betTicketRepository,
                betSettlementRepository,
                raceRepository,
                raceEntryRepository,
                raceResultRepository,
                registrationRepository,
                horseRepository,
                userRepository,
                userVerificationRepository,
                walletRepository,
                walletTransactionRepository,
                fundAccountingService
        );
    }

    @Test
    void settlementUsesMinimumOddsAndSystemReserve() {
        BetEvent event = closedEvent();
        BetTicket winner = ticket(100, 1000, WINNER_ENTRY_ID, "1000000.00");
        BetTicket loser = ticket(101, 1001, LOSER_ENTRY_ID, "10000.00");
        Wallet winnerWallet = wallet(1000, "2000000.00", "1000000.00");
        Wallet loserWallet = wallet(1001, "20000.00", "10000.00");
        stubSettlement(event, List.of(winner, loser));
        when(walletRepository.findByWalletIdForUpdate(1000)).thenReturn(Optional.of(winnerWallet));
        when(walletRepository.findByWalletIdForUpdate(1001)).thenReturn(Optional.of(loserWallet));
        when(fundAccountingService.canCoverBettingSettlement(
                new BigDecimal("101000.00"),
                new BigDecimal("141000.00")
        )).thenReturn(true);

        var result = service.settleRaceEvents(RACE_ID, ADMIN_ID).getFirst();

        assertEquals(new BigDecimal("0.9090"), result.getRawOdds());
        assertEquals(new BigDecimal("1.0500"), result.getFinalOdds());
        assertEquals(new BigDecimal("1050000.00"), result.getTotalPayout());
        assertEquals(new BigDecimal("141000.00"), result.getSubsidyAmount());
        assertEquals("PAID", result.getOutcome());
        assertEquals(BetTicketStatus.WON, winner.getStatus());
        assertEquals(new BigDecimal("2050000.00"), winnerWallet.getBalance());
        assertEquals(BetTicketStatus.LOST, loser.getStatus());
        assertEquals(new BigDecimal("10000.00"), loserWallet.getBalance());
        assertEquals(BetEventStatus.SETTLED, event.getStatus());
        verify(fundAccountingService).recordBettingSettlement(any(BetSettlement.class));
    }

    @Test
    void insufficientReserveVoidsAndReleasesEveryStake() {
        BetEvent event = closedEvent();
        BetTicket winner = ticket(100, 1000, WINNER_ENTRY_ID, "1000000.00");
        BetTicket loser = ticket(101, 1001, LOSER_ENTRY_ID, "10000.00");
        Wallet winnerWallet = wallet(1000, "2000000.00", "1000000.00");
        Wallet loserWallet = wallet(1001, "20000.00", "10000.00");
        stubSettlement(event, List.of(winner, loser));
        when(walletRepository.findByWalletIdForUpdate(1000)).thenReturn(Optional.of(winnerWallet));
        when(walletRepository.findByWalletIdForUpdate(1001)).thenReturn(Optional.of(loserWallet));
        when(fundAccountingService.canCoverBettingSettlement(any(), any())).thenReturn(false);

        var result = service.settleRaceEvents(RACE_ID, ADMIN_ID).getFirst();

        assertEquals("VOIDED", result.getOutcome());
        assertEquals("INSUFFICIENT_SYSTEM_RESERVE", result.getVoidReason());
        assertEquals(BetTicketStatus.VOID, winner.getStatus());
        assertEquals(BigDecimal.ZERO.setScale(2), winnerWallet.getLockedBalance());
        assertEquals(new BigDecimal("2000000.00"), winnerWallet.getBalance());
        assertEquals(BetTicketStatus.VOID, loser.getStatus());
        assertEquals(new BigDecimal("20000.00"), loserWallet.getBalance());
        assertEquals(BetEventStatus.CANCELLED, event.getStatus());
        verify(fundAccountingService, never()).recordBettingSettlement(any());
    }

    @Test
    void noWinningTicketRefundsThePoolWithoutChargingFee() {
        BetEvent event = closedEvent();
        BetTicket loser = ticket(101, 1001, LOSER_ENTRY_ID, "10000.00");
        Wallet loserWallet = wallet(1001, "20000.00", "10000.00");
        stubSettlement(event, List.of(loser));
        when(walletRepository.findByWalletIdForUpdate(1001)).thenReturn(Optional.of(loserWallet));

        var result = service.settleRaceEvents(RACE_ID, ADMIN_ID).getFirst();

        assertEquals("VOIDED", result.getOutcome());
        assertEquals("NO_WINNING_BETS", result.getVoidReason());
        assertEquals(BetTicketStatus.VOID, loser.getStatus());
        assertEquals(new BigDecimal("20000.00"), loserWallet.getBalance());
        assertEquals(BigDecimal.ZERO.setScale(2), loserWallet.getLockedBalance());
        verify(fundAccountingService, never()).canCoverBettingSettlement(any(), any());
        verify(fundAccountingService, never()).recordBettingSettlement(any());
    }

    private void stubSettlement(BetEvent event, List<BetTicket> tickets) {
        when(betEventRepository.findByRaceIdAndStatusInForUpdate(
                eq(RACE_ID), any()
        )).thenReturn(List.of(event));
        when(betProductRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product()));
        when(raceResultRepository.findByRaceIdOrderByFinishPositionAsc(RACE_ID))
                .thenReturn(List.of(winnerResult()));
        when(betTicketRepository.findPlacedByEventForUpdate(EVENT_ID, BetTicketStatus.PLACED))
                .thenReturn(tickets);
        when(betSettlementRepository.existsByBetEventId(EVENT_ID)).thenReturn(false);
        when(betSettlementRepository.save(any(BetSettlement.class))).thenAnswer(invocation -> {
            BetSettlement settlement = invocation.getArgument(0);
            settlement.setBetSettlementId(500);
            return settlement;
        });
    }

    private BetEvent closedEvent() {
        BetEvent event = new BetEvent();
        event.setBetEventId(EVENT_ID);
        event.setRaceId(RACE_ID);
        event.setBetProductId(PRODUCT_ID);
        event.setStatus(BetEventStatus.CLOSED);
        event.setOperatorFeeRate(new BigDecimal("0.1000"));
        event.setOpenAt(LocalDateTime.now().minusHours(2));
        event.setCloseAt(LocalDateTime.now().minusHours(1));
        return event;
    }

    private BetProduct product() {
        BetProduct product = new BetProduct();
        product.setBetProductId(PRODUCT_ID);
        product.setCode("WIN");
        product.setMinimumOdds(new BigDecimal("1.0500"));
        return product;
    }

    private RaceResult winnerResult() {
        RaceResult result = new RaceResult();
        result.setRaceEntryId(WINNER_ENTRY_ID);
        result.setFinishPosition(1);
        return result;
    }

    private BetTicket ticket(int ticketId, int walletId, int entryId, String stake) {
        BetTicket ticket = new BetTicket();
        ticket.setBetTicketId(ticketId);
        ticket.setBetEventId(EVENT_ID);
        ticket.setWalletId(walletId);
        ticket.setRaceId(RACE_ID);
        ticket.setRaceEntryId(entryId);
        ticket.setStake(new BigDecimal(stake));
        ticket.setStatus(BetTicketStatus.PLACED);
        ticket.setPlacedAt(LocalDateTime.now().minusHours(1));
        return ticket;
    }

    private Wallet wallet(int walletId, String balance, String locked) {
        Wallet wallet = new Wallet();
        wallet.setWalletId(walletId);
        wallet.setUserId(walletId);
        wallet.setBalance(new BigDecimal(balance));
        wallet.setLockedBalance(new BigDecimal(locked));
        return wallet;
    }
}
