package com.example.backend.service;

import com.example.backend.constant.BetEventStatus;
import com.example.backend.constant.BetTicketStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.dto.response.AdminBetEventDetailResponse;
import com.example.backend.dto.response.AdminBetSettlementDetailResponse;
import com.example.backend.dto.response.AdminBetTicketResponse;
import com.example.backend.entity.BetEvent;
import com.example.backend.entity.BetProduct;
import com.example.backend.entity.BetSettlement;
import com.example.backend.entity.BetTicket;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
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
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class BettingServiceAdminReadTest {

    private static final String ADMIN_EMAIL = "admin@test.com";
    private static final Integer EVENT_ID = 10;
    private static final Integer PRODUCT_ID = 20;
    private static final Integer RACE_ID = 30;
    private static final Integer TICKET_ID = 40;
    private static final Integer RACE_ENTRY_ID = 50;
    private static final Integer REGISTRATION_ID = 60;
    private static final Integer HORSE_ID = 70;
    private static final Integer BETTOR_ID = 80;
    private static final Integer OWNER_ID = 90;
    private static final Integer JOCKEY_ID = 100;
    private static final Integer ADMIN_ID = 110;
    private static final Integer SETTLEMENT_ID = 120;

    @Mock
    private BetProductRepository betProductRepository;
    @Mock
    private BetEventRepository betEventRepository;
    @Mock
    private BetTicketRepository betTicketRepository;
    @Mock
    private BetSettlementRepository betSettlementRepository;
    @Mock
    private RaceRepository raceRepository;
    @Mock
    private RaceEntryRepository raceEntryRepository;
    @Mock
    private RaceResultRepository raceResultRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private HorseRepository horseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserVerificationRepository userVerificationRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletTransactionRepository walletTransactionRepository;
    @Mock
    private FundAccountingService fundAccountingService;

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
    void getAdminEventDetailReturnsEventTicketsAndSettlement() {
        stubAdmin();
        stubEventCore();
        stubTicketContext();
        BetSettlement settlement = settlement();
        when(betSettlementRepository.findByBetEventId(EVENT_ID)).thenReturn(Optional.of(settlement));

        AdminBetEventDetailResponse result = service.getAdminEventDetail(EVENT_ID, ADMIN_EMAIL);

        assertEquals(EVENT_ID, result.getEvent().getBetEventId());
        assertEquals("Bangkok Sprint", result.getEvent().getRaceName());
        assertEquals(new BigDecimal("500000.00"), result.getEvent().getTotalStake());
        assertEquals(1, result.getTickets().size());
        AdminBetTicketResponse ticket = result.getTickets().getFirst();
        assertEquals(TICKET_ID, ticket.getBetTicketId());
        assertEquals("spectator.minh", ticket.getBettorName());
        assertEquals("Demo Thunder", ticket.getHorseName());
        assertEquals("owner.huy", ticket.getOwnerName());
        assertEquals("jockey.nam", ticket.getJockeyName());
        assertEquals(3, ticket.getStartingStall());
        assertNotNull(result.getSettlement());
        assertEquals(SETTLEMENT_ID, result.getSettlement().getBetSettlementId());
    }

    @Test
    void getAdminSettlementDetailReturnsSettlementAndRelatedTickets() {
        stubAdmin();
        stubEventCore();
        stubTicketContext();
        BetSettlement settlement = settlement();
        when(betSettlementRepository.findById(SETTLEMENT_ID)).thenReturn(Optional.of(settlement));
        when(userRepository.findById(ADMIN_ID)).thenReturn(Optional.of(user(ADMIN_ID, "admin", "admin@test.com", "ADMIN")));

        AdminBetSettlementDetailResponse result = service.getAdminSettlementDetail(SETTLEMENT_ID, ADMIN_EMAIL);

        assertEquals(SETTLEMENT_ID, result.getSettlement().getBetSettlementId());
        assertEquals("Bangkok Sprint", result.getSettlement().getRaceName());
        assertEquals("WIN", result.getSettlement().getProductCode());
        assertEquals("admin", result.getSettlement().getSettledByName());
        assertEquals(1, result.getTickets().size());
        assertEquals(TICKET_ID, result.getTickets().getFirst().getBetTicketId());
    }

    @Test
    void getAdminEventTicketsRejectsNonAdmin() {
        when(userRepository.findByEmail(ADMIN_EMAIL))
                .thenReturn(Optional.of(user(OWNER_ID, "owner.huy", "owner@test.com", "OWNER")));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getAdminEventTickets(EVENT_ID, ADMIN_EMAIL)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void getAdminSettlementDetailRejectsMissingSettlement() {
        stubAdmin();
        when(betSettlementRepository.findById(SETTLEMENT_ID)).thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getAdminSettlementDetail(SETTLEMENT_ID, ADMIN_EMAIL)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }

    private void stubEventCore() {
        BetEvent event = event();
        when(betEventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
        when(raceRepository.findById(RACE_ID)).thenReturn(Optional.of(race()));
        when(betProductRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product()));
        lenient().when(betTicketRepository.sumStakeByEvent(
                        eq(EVENT_ID),
                        anyCollection()
                ))
                .thenReturn(new BigDecimal("500000.00"));
        lenient().when(raceEntryRepository.findByRaceIdAndStatusOrderByStartingStallAsc(RACE_ID, RaceEntryStatus.ASSIGNED))
                .thenReturn(List.of());
    }

    private void stubTicketContext() {
        when(betTicketRepository.findByBetEventIdOrderByPlacedAtAsc(EVENT_ID)).thenReturn(List.of(ticket()));
        when(raceEntryRepository.findById(RACE_ENTRY_ID)).thenReturn(Optional.of(raceEntry()));
        when(registrationRepository.findById(REGISTRATION_ID)).thenReturn(Optional.of(registration()));
        when(horseRepository.findById(HORSE_ID)).thenReturn(Optional.of(horse()));
        when(userRepository.findById(BETTOR_ID))
                .thenReturn(Optional.of(user(BETTOR_ID, "spectator.minh", "spectator@test.com", "SPECTATOR")));
        when(userRepository.findById(OWNER_ID))
                .thenReturn(Optional.of(user(OWNER_ID, "owner.huy", "owner@test.com", "OWNER")));
        when(userRepository.findById(JOCKEY_ID))
                .thenReturn(Optional.of(user(JOCKEY_ID, "jockey.nam", "jockey@test.com", "JOCKEY")));
    }

    private void stubAdmin() {
        when(userRepository.findByEmail(ADMIN_EMAIL))
                .thenReturn(Optional.of(user(ADMIN_ID, "admin", ADMIN_EMAIL, "ADMIN")));
    }

    private BetEvent event() {
        BetEvent event = new BetEvent();
        event.setBetEventId(EVENT_ID);
        event.setRaceId(RACE_ID);
        event.setBetProductId(PRODUCT_ID);
        event.setStatus(BetEventStatus.SETTLED);
        event.setOpenAt(LocalDateTime.now().minusDays(2));
        event.setCloseAt(LocalDateTime.now().minusDays(1));
        event.setOperatorFeeRate(new BigDecimal("0.1000"));
        event.setCreatedBy(ADMIN_ID);
        event.setSettledBy(ADMIN_ID);
        event.setSettledAt(LocalDateTime.now());
        return event;
    }

    private Race race() {
        Race race = new Race();
        race.setRaceId(RACE_ID);
        race.setRaceName("Bangkok Sprint");
        race.setTrackName("Bangkok Track A");
        race.setRaceStartTime(LocalDateTime.now().minusHours(2));
        return race;
    }

    private BetProduct product() {
        BetProduct product = new BetProduct();
        product.setBetProductId(PRODUCT_ID);
        product.setCode("WIN");
        product.setName("Winner");
        product.setMinStake(new BigDecimal("10000.00"));
        product.setMaxDailyStake(new BigDecimal("1000000.00"));
        product.setOperatorFeeRate(new BigDecimal("0.1000"));
        product.setActive(true);
        return product;
    }

    private BetTicket ticket() {
        BetTicket ticket = new BetTicket();
        ticket.setBetTicketId(TICKET_ID);
        ticket.setBetEventId(EVENT_ID);
        ticket.setUserId(BETTOR_ID);
        ticket.setWalletId(999);
        ticket.setRaceId(RACE_ID);
        ticket.setRaceEntryId(RACE_ENTRY_ID);
        ticket.setStake(new BigDecimal("500000.00"));
        ticket.setEstimatedOddsAtBet(new BigDecimal("1.5000"));
        ticket.setFinalOdds(new BigDecimal("1.8000"));
        ticket.setPayoutAmount(new BigDecimal("900000.00"));
        ticket.setStatus(BetTicketStatus.WON);
        ticket.setPlacedAt(LocalDateTime.now().minusHours(3));
        ticket.setSettledAt(LocalDateTime.now().minusHours(1));
        return ticket;
    }

    private BetSettlement settlement() {
        BetSettlement settlement = new BetSettlement();
        settlement.setBetSettlementId(SETTLEMENT_ID);
        settlement.setBetEventId(EVENT_ID);
        settlement.setTotalStake(new BigDecimal("500000.00"));
        settlement.setWinningStake(new BigDecimal("500000.00"));
        settlement.setLosingStake(BigDecimal.ZERO);
        settlement.setOperatorFee(new BigDecimal("50000.00"));
        settlement.setPayoutPool(new BigDecimal("450000.00"));
        settlement.setSettledBy(ADMIN_ID);
        settlement.setSettledAt(LocalDateTime.now().minusMinutes(30));
        return settlement;
    }

    private RaceEntry raceEntry() {
        RaceEntry entry = new RaceEntry();
        entry.setRaceEntryId(RACE_ENTRY_ID);
        entry.setRaceId(RACE_ID);
        entry.setRegistrationId(REGISTRATION_ID);
        entry.setStartingStall(3);
        entry.setStatus(RaceEntryStatus.ASSIGNED);
        return entry;
    }

    private Registration registration() {
        Registration registration = new Registration();
        registration.setRegistrationId(REGISTRATION_ID);
        registration.setHorseId(HORSE_ID);
        registration.setOwnerId(OWNER_ID);
        registration.setJockeyId(JOCKEY_ID);
        return registration;
    }

    private Horse horse() {
        Horse horse = new Horse();
        horse.setHorseId(HORSE_ID);
        horse.setHorseName("Demo Thunder");
        return horse;
    }

    private User user(Integer userId, String username, String email, String roleName) {
        Role role = new Role();
        role.setRoleName(roleName);
        User user = new User();
        user.setUserID(userId);
        user.setUsername(username);
        user.setEmail(email);
        user.setStatus("ACTIVE");
        user.setRole(role);
        return user;
    }
}
