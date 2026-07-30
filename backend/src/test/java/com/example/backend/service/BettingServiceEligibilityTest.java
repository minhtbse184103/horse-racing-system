package com.example.backend.service;

import com.example.backend.constant.BetEventStatus;
import com.example.backend.constant.EventStatus;
import com.example.backend.dto.request.CreateBetEventRequest;
import com.example.backend.dto.response.AdminBettingEligibleRaceResponse;
import com.example.backend.dto.response.BetEventResponse;
import com.example.backend.entity.BetEvent;
import com.example.backend.entity.BetProduct;
import com.example.backend.entity.Race;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BettingServiceEligibilityTest {

    private static final String ADMIN_EMAIL = "admin@test.com";
    private static final int ADMIN_ID = 1;
    private static final int RACE_ID = 7;
    private static final int PRODUCT_ID = 2;

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
    void getEligibleRacesReturnsOnlyRepositoryCandidatesForActiveProduct() {
        Race race = finalizedRace();
        when(betProductRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct()));
        when(raceRepository.findEligibleForBetting(
                eq(PRODUCT_ID),
                eq(EventStatus.ENTRIES_FINALIZED),
                any(LocalDateTime.class)
        )).thenReturn(List.of(race));

        List<AdminBettingEligibleRaceResponse> result = service.getEligibleRaces(PRODUCT_ID);

        assertEquals(1, result.size());
        assertEquals(RACE_ID, result.getFirst().getRaceId());
        assertEquals("Betting Demo Sprint", result.getFirst().getRaceName());
        assertEquals(EventStatus.ENTRIES_FINALIZED, result.getFirst().getStatus());
    }

    @Test
    void createEventRejectsRaceWhoseEntriesAreStillEditable() {
        Race race = finalizedRace();
        race.setStatus(EventStatus.REGISTRATION_CLOSED);
        race.setEntryFinalizedAt(null);
        stubAdmin();
        when(raceRepository.findByIdForUpdate(RACE_ID)).thenReturn(Optional.of(race));
        when(betProductRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct()));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createEvent(validRequest(race), ADMIN_EMAIL)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Race entries must be finalized before betting can be configured.",
                exception.getMessage()
        );
        verify(betEventRepository, never()).save(any());
    }

    @Test
    void createEventAcceptsFinalizedFutureRace() {
        Race race = finalizedRace();
        CreateBetEventRequest request = validRequest(race);
        stubAdmin();
        when(raceRepository.findByIdForUpdate(RACE_ID)).thenReturn(Optional.of(race));
        when(raceRepository.findById(RACE_ID)).thenReturn(Optional.of(race));
        when(betProductRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(activeProduct()));
        when(betEventRepository.existsByRaceIdAndBetProductId(RACE_ID, PRODUCT_ID)).thenReturn(false);
        when(betEventRepository.save(any(BetEvent.class))).thenAnswer(invocation -> {
            BetEvent event = invocation.getArgument(0);
            event.setBetEventId(99);
            return event;
        });

        BetEventResponse result = service.createEvent(request, ADMIN_EMAIL);

        assertEquals(99, result.getBetEventId());
        assertEquals(BetEventStatus.DRAFT, result.getStatus());
        assertEquals(RACE_ID, result.getRaceId());
    }

    @Test
    void openEventRejectsRaceThatIsNotFinalizedWithoutCountingEntries() {
        Race race = finalizedRace();
        race.setStatus(EventStatus.REGISTRATION_CLOSED);
        race.setEntryFinalizedAt(null);
        BetEvent event = eventFor(race);
        when(betEventRepository.findByIdForUpdate(99)).thenReturn(Optional.of(event));
        when(raceRepository.findById(RACE_ID)).thenReturn(Optional.of(race));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.openEvent(99)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceEntryRepository, never()).countByRaceIdAndStatus(any(), any());
        verify(betEventRepository, never()).save(any());
    }

    private CreateBetEventRequest validRequest(Race race) {
        CreateBetEventRequest request = new CreateBetEventRequest();
        request.setRaceId(RACE_ID);
        request.setBetProductId(PRODUCT_ID);
        request.setOpenAt(race.getRaceStartTime().minusHours(6));
        request.setCloseAt(race.getRaceStartTime().minusMinutes(1));
        request.setOperatorFeeRate(new BigDecimal("0.1000"));
        return request;
    }

    private Race finalizedRace() {
        Race race = new Race();
        race.setRaceId(RACE_ID);
        race.setRaceName("Betting Demo Sprint");
        race.setTrackName("Bangkok Track C");
        race.setRaceStartTime(LocalDateTime.now().plusHours(8));
        race.setStatus(EventStatus.ENTRIES_FINALIZED);
        race.setEntryFinalizedAt(LocalDateTime.now().minusHours(1));
        race.setEntryFinalizedBy(ADMIN_ID);
        return race;
    }

    private BetProduct activeProduct() {
        BetProduct product = new BetProduct();
        product.setBetProductId(PRODUCT_ID);
        product.setCode("PLACE");
        product.setName("Place");
        product.setMinStake(new BigDecimal("10000.00"));
        product.setMaxDailyStake(new BigDecimal("1000000.00"));
        product.setOperatorFeeRate(new BigDecimal("0.1000"));
        product.setActive(true);
        return product;
    }

    private BetEvent eventFor(Race race) {
        BetEvent event = new BetEvent();
        event.setBetEventId(99);
        event.setRaceId(race.getRaceId());
        event.setBetProductId(PRODUCT_ID);
        event.setStatus(BetEventStatus.DRAFT);
        event.setOpenAt(race.getRaceStartTime().minusHours(6));
        event.setCloseAt(race.getRaceStartTime().minusMinutes(1));
        event.setOperatorFeeRate(new BigDecimal("0.1000"));
        return event;
    }

    private void stubAdmin() {
        Role role = new Role();
        role.setRoleName("ADMIN");
        User admin = new User();
        admin.setUserID(ADMIN_ID);
        admin.setEmail(ADMIN_EMAIL);
        admin.setStatus("ACTIVE");
        admin.setRole(role);
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));
    }
}
