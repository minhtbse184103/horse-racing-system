package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.CancelRaceEntryRequest;
import com.example.backend.dto.request.CreateRaceEntryRequest;
import com.example.backend.dto.response.RaceEntryCandidateResponse;
import com.example.backend.dto.response.RaceEntryResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceEntryServiceTest {

    private static final Integer ADMIN_ID = 1;
    private static final Integer OWNER_ID = 2;
    private static final Integer TOURNAMENT_ID = 10;
    private static final Integer RACE_ID = 20;
    private static final Integer REGISTRATION_ID = 30;
    private static final Integer HORSE_ID = 40;
    private static final Integer RACE_ENTRY_ID = 50;
    private static final String ADMIN_EMAIL = "admin@test.com";

    @Mock
    private RaceEntryRepository raceEntryRepository;
    @Mock
    private RaceRepository raceRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private TournamentRepository tournamentRepository;
    @Mock
    private HorseRepository horseRepository;
    @Mock
    private UserRepository userRepository;

    private RaceEntryService raceEntryService;

    @BeforeEach
    void setUp() {
        raceEntryService = new RaceEntryService(
                raceEntryRepository,
                raceRepository,
                registrationRepository,
                tournamentRepository,
                horseRepository,
                userRepository
        );
    }

    @Test
    void getAssignmentQueueUsesApprovedPaidAndAssignedStatuses() {
        Registration registration = approvedPaidRegistration();
        when(registrationRepository.findApprovedAndUnassigned(
                RegistrationStatus.APPROVED,
                PaymentStatus.PAID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(List.of(registration));
        stubCandidateMapping(registration);

        List<RaceEntryCandidateResponse> result =
                raceEntryService.getAssignmentQueue();

        assertEquals(1, result.size());
        assertEquals(REGISTRATION_ID, result.getFirst().getRegistrationId());
        verify(registrationRepository).findApprovedAndUnassigned(
                RegistrationStatus.APPROVED,
                PaymentStatus.PAID,
                RaceEntryStatus.ASSIGNED
        );
    }

    @Test
    void getAssignmentQueueByTournamentUsesTournamentAndActiveStatuses() {
        Registration registration = approvedPaidRegistration();
        when(tournamentRepository.existsById(TOURNAMENT_ID)).thenReturn(true);
        when(registrationRepository.findApprovedAndUnassignedByTournament(
                TOURNAMENT_ID,
                RegistrationStatus.APPROVED,
                PaymentStatus.PAID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(List.of(registration));
        stubCandidateMapping(registration);

        List<RaceEntryCandidateResponse> result =
                raceEntryService.getAssignmentQueueByTournament(TOURNAMENT_ID);

        assertEquals(1, result.size());
        verify(registrationRepository).findApprovedAndUnassignedByTournament(
                TOURNAMENT_ID,
                RegistrationStatus.APPROVED,
                PaymentStatus.PAID,
                RaceEntryStatus.ASSIGNED
        );
    }

    @Test
    void getEntriesByRaceRequestsAssignedEntriesOnly() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        RaceEntry entry = assignedEntry();
        when(raceRepository.existsById(RACE_ID)).thenReturn(true);
        when(raceEntryRepository
                .findByRaceIdAndStatusOrderByStartingStallAsc(
                        RACE_ID,
                        RaceEntryStatus.ASSIGNED
                )).thenReturn(List.of(entry));
        stubResponseMapping(race, registration);

        List<RaceEntryResponse> result =
                raceEntryService.getEntriesByRace(RACE_ID);

        assertEquals(1, result.size());
        assertEquals(RaceEntryStatus.ASSIGNED, result.getFirst().getStatus());
        verify(raceEntryRepository)
                .findByRaceIdAndStatusOrderByStartingStallAsc(
                        RACE_ID,
                        RaceEntryStatus.ASSIGNED
                );
    }

    @Test
    void assignRegistrationCreatesAssignedRaceEntry() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        stubSuccessfulAssignment(race, registration);

        RaceEntryResponse response = raceEntryService.assignRegistration(
                createRequest(),
                ADMIN_EMAIL
        );

        ArgumentCaptor<RaceEntry> captor =
                ArgumentCaptor.forClass(RaceEntry.class);
        verify(raceEntryRepository).saveAndFlush(captor.capture());
        RaceEntry saved = captor.getValue();

        assertEquals(RACE_ID, saved.getRaceId());
        assertEquals(REGISTRATION_ID, saved.getRegistrationId());
        assertEquals(1, saved.getStartingStall());
        assertEquals(RaceEntryStatus.ASSIGNED, saved.getStatus());
        assertEquals(ADMIN_ID, saved.getAssignedBy());
        assertNotNull(saved.getAssignedAt());
        assertEquals(RaceEntryStatus.ASSIGNED, response.getStatus());

        InOrder lockOrder = inOrder(raceRepository, registrationRepository);
        lockOrder.verify(raceRepository).findByIdForUpdate(RACE_ID);
        lockOrder.verify(registrationRepository)
                .findByIdForUpdate(REGISTRATION_ID);
    }

    @Test
    void assignRegistrationRejectsActiveDuplicate() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        stubLockedAssignmentData(race, registration);
        when(raceEntryRepository.existsByRegistrationIdAndStatus(
                REGISTRATION_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEntryService.assignRegistration(
                        createRequest(),
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceEntryRepository, never()).saveAndFlush(any());
    }

    @Test
    void assignRegistrationRejectsFullRace() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        stubLockedAssignmentData(race, registration);
        when(raceEntryRepository.existsByRegistrationIdAndStatus(
                REGISTRATION_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(false);
        when(raceEntryRepository.countByRaceIdAndStatus(
                RACE_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEntryService.assignRegistration(
                        createRequest(),
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceEntryRepository, never()).saveAndFlush(any());
    }

    @Test
    void cancelledHistoryDoesNotBlockAssignment() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        stubSuccessfulAssignment(race, registration);

        RaceEntryResponse response = raceEntryService.assignRegistration(
                createRequest(),
                ADMIN_EMAIL
        );

        assertEquals(RaceEntryStatus.ASSIGNED, response.getStatus());
        verify(raceEntryRepository).existsByRegistrationIdAndStatus(
                REGISTRATION_ID,
                RaceEntryStatus.ASSIGNED
        );
    }

    @Test
    void assignRegistrationQueriesAssignedOccupiedStalls() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        stubSuccessfulAssignment(race, registration);

        raceEntryService.assignRegistration(createRequest(), ADMIN_EMAIL);

        verify(raceEntryRepository).findOccupiedStartingStalls(
                RACE_ID,
                RaceEntryStatus.ASSIGNED
        );
    }

    @Test
    void cancelEntrySetsCancellationAuditFields() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        RaceEntry entry = assignedEntry();
        LocalDateTime originalAssignedAt = entry.getAssignedAt();
        stubSuccessfulCancellation(entry, race, registration);

        raceEntryService.cancelEntry(
                RACE_ENTRY_ID,
                cancelRequest("Administrative withdrawal"),
                ADMIN_EMAIL
        );

        ArgumentCaptor<RaceEntry> captor =
                ArgumentCaptor.forClass(RaceEntry.class);
        verify(raceEntryRepository).saveAndFlush(captor.capture());
        RaceEntry saved = captor.getValue();

        assertEquals(RaceEntryStatus.CANCELLED, saved.getStatus());
        assertNotNull(saved.getCancelledAt());
        assertEquals(ADMIN_ID, saved.getCancelledBy());
        assertEquals("Administrative withdrawal",
                saved.getCancellationReason());
        assertEquals(ADMIN_ID, saved.getAssignedBy());
        assertEquals(originalAssignedAt, saved.getAssignedAt());
        assertEquals(RACE_ID, saved.getRaceId());
        assertEquals(REGISTRATION_ID, saved.getRegistrationId());
        assertEquals(1, saved.getStartingStall());
    }

    @Test
    void cancelEntryTrimsCancellationReason() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        RaceEntry entry = assignedEntry();
        stubSuccessfulCancellation(entry, race, registration);

        raceEntryService.cancelEntry(
                RACE_ENTRY_ID,
                cancelRequest("  Schedule changed  "),
                ADMIN_EMAIL
        );

        ArgumentCaptor<RaceEntry> captor =
                ArgumentCaptor.forClass(RaceEntry.class);
        verify(raceEntryRepository).saveAndFlush(captor.capture());
        assertEquals("Schedule changed",
                captor.getValue().getCancellationReason());
    }

    @Test
    void cancelEntryRejectsRepeatedCancellation() {
        RaceEntry entry = assignedEntry();
        entry.setStatus(RaceEntryStatus.CANCELLED);
        when(raceEntryRepository.findByIdForUpdate(RACE_ENTRY_ID))
                .thenReturn(Optional.of(entry));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEntryService.cancelEntry(
                        RACE_ENTRY_ID,
                        cancelRequest("Again"),
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceEntryRepository, never()).saveAndFlush(any());
    }

    @Test
    void cancelEntryRejectsCancellationAfterRaceStart() {
        Race race = futureRace();
        race.setRaceStartTime(LocalDateTime.now().minusMinutes(1));
        RaceEntry entry = assignedEntry();
        stubCancellationTarget(entry, race);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEntryService.cancelEntry(
                        RACE_ENTRY_ID,
                        cancelRequest("Too late"),
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceEntryRepository, never()).saveAndFlush(any());
    }

    @Test
    void cancelEntryRejectsBlankReason() {
        Race race = futureRace();
        RaceEntry entry = assignedEntry();
        stubCancellationTarget(entry, race);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEntryService.cancelEntry(
                        RACE_ENTRY_ID,
                        cancelRequest("   "),
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceEntryRepository, never()).saveAndFlush(any());
    }

    @Test
    void cancelEntryRejectsNullRequest() {
        Race race = futureRace();
        RaceEntry entry = assignedEntry();
        stubCancellationTarget(entry, race);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEntryService.cancelEntry(
                        RACE_ENTRY_ID,
                        null,
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceEntryRepository, never()).saveAndFlush(any());
    }

    @Test
    void cancelEntryRejectsNullReason() {
        Race race = futureRace();
        RaceEntry entry = assignedEntry();
        CancelRaceEntryRequest request = new CancelRaceEntryRequest();
        stubCancellationTarget(entry, race);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEntryService.cancelEntry(
                        RACE_ENTRY_ID,
                        request,
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceEntryRepository, never()).saveAndFlush(any());
    }

    @Test
    void cancelEntryMapsCancellationFieldsInResponse() {
        Race race = futureRace();
        Registration registration = approvedPaidRegistration();
        RaceEntry entry = assignedEntry();
        stubSuccessfulCancellation(entry, race, registration);

        RaceEntryResponse response = raceEntryService.cancelEntry(
                RACE_ENTRY_ID,
                cancelRequest("  Mapping check  "),
                ADMIN_EMAIL
        );

        assertEquals(RaceEntryStatus.CANCELLED, response.getStatus());
        assertNotNull(response.getCancelledAt());
        assertEquals(ADMIN_ID, response.getCancelledBy());
        assertEquals("Mapping check", response.getCancellationReason());
        assertEquals(ADMIN_ID, response.getAssignedBy());
        assertNotNull(response.getAssignedAt());
    }

    private void stubCandidateMapping(Registration registration) {
        when(tournamentRepository.findById(TOURNAMENT_ID))
                .thenReturn(Optional.of(tournament()));
        when(horseRepository.findById(HORSE_ID))
                .thenReturn(Optional.of(horse()));
        when(userRepository.findById(OWNER_ID))
                .thenReturn(Optional.of(owner()));
        assertNull(registration.getJockeyId());
    }

    private void stubLockedAssignmentData(
            Race race,
            Registration registration
    ) {
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race));
        when(registrationRepository.findByIdForUpdate(REGISTRATION_ID))
                .thenReturn(Optional.of(registration));
        when(userRepository.findByEmail(ADMIN_EMAIL))
                .thenReturn(Optional.of(admin()));
    }

    private void stubSuccessfulAssignment(
            Race race,
            Registration registration
    ) {
        stubLockedAssignmentData(race, registration);
        when(raceEntryRepository.existsByRegistrationIdAndStatus(
                REGISTRATION_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(false);
        when(raceEntryRepository.countByRaceIdAndStatus(
                RACE_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(0L);
        when(raceEntryRepository.findOccupiedStartingStalls(
                RACE_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(List.of());
        stubRaceEntrySave();
        stubResponseMapping(race, registration);
    }

    private void stubCancellationTarget(RaceEntry entry, Race race) {
        when(raceEntryRepository.findByIdForUpdate(RACE_ENTRY_ID))
                .thenReturn(Optional.of(entry));
        when(raceRepository.findById(RACE_ID))
                .thenReturn(Optional.of(race));
    }

    private void stubSuccessfulCancellation(
            RaceEntry entry,
            Race race,
            Registration registration
    ) {
        stubCancellationTarget(entry, race);
        when(userRepository.findByEmail(ADMIN_EMAIL))
                .thenReturn(Optional.of(admin()));
        stubRaceEntrySave();
        stubResponseMapping(race, registration);
    }

    private void stubRaceEntrySave() {
        when(raceEntryRepository.saveAndFlush(any(RaceEntry.class)))
                .thenAnswer(invocation -> {
                    RaceEntry entry = invocation.getArgument(0);
                    if (entry.getRaceEntryId() == null) {
                        entry.setRaceEntryId(RACE_ENTRY_ID);
                    }
                    return entry;
                });
    }

    private void stubResponseMapping(
            Race race,
            Registration registration
    ) {
        when(raceRepository.findById(RACE_ID))
                .thenReturn(Optional.of(race));
        when(registrationRepository.findById(REGISTRATION_ID))
                .thenReturn(Optional.of(registration));
        when(tournamentRepository.findById(TOURNAMENT_ID))
                .thenReturn(Optional.of(tournament()));
        when(horseRepository.findById(HORSE_ID))
                .thenReturn(Optional.of(horse()));
        when(userRepository.findById(OWNER_ID))
                .thenReturn(Optional.of(owner()));
        when(userRepository.findById(ADMIN_ID))
                .thenReturn(Optional.of(admin()));
    }

    private Race futureRace() {
        Race race = new Race();
        race.setRaceId(RACE_ID);
        race.setTournamentId(TOURNAMENT_ID);
        race.setRaceName("Qualifier 1");
        race.setTrackName("Main Track");
        race.setRaceStartTime(LocalDateTime.now().plusDays(2));
        race.setRaceEndTime(LocalDateTime.now().plusDays(2).plusHours(1));
        race.setDistance(1200);
        race.setMaxRunners(1);
        race.setRaceOrder(1);
        race.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        return race;
    }

    private Registration approvedPaidRegistration() {
        Registration registration = new Registration();
        registration.setRegistrationId(REGISTRATION_ID);
        registration.setTournamentId(TOURNAMENT_ID);
        registration.setHorseId(HORSE_ID);
        registration.setOwnerId(OWNER_ID);
        registration.setRegistrationNo("REG-001");
        registration.setPaymentStatus(PaymentStatus.PAID);
        registration.setApprovalStatus(RegistrationStatus.APPROVED);
        registration.setSubmittedAt(LocalDateTime.now().minusDays(2));
        registration.setReviewedAt(LocalDateTime.now().minusDays(1));
        registration.setReviewedBy(ADMIN_ID);
        return registration;
    }

    private RaceEntry assignedEntry() {
        RaceEntry entry = new RaceEntry();
        entry.setRaceEntryId(RACE_ENTRY_ID);
        entry.setRaceId(RACE_ID);
        entry.setRegistrationId(REGISTRATION_ID);
        entry.setStartingStall(1);
        entry.setStatus(RaceEntryStatus.ASSIGNED);
        entry.setAssignedBy(ADMIN_ID);
        entry.setAssignedAt(LocalDateTime.now().minusHours(2));
        return entry;
    }

    private CreateRaceEntryRequest createRequest() {
        CreateRaceEntryRequest request = new CreateRaceEntryRequest();
        request.setRaceId(RACE_ID);
        request.setRegistrationId(REGISTRATION_ID);
        return request;
    }

    private CancelRaceEntryRequest cancelRequest(String reason) {
        CancelRaceEntryRequest request = new CancelRaceEntryRequest();
        request.setCancellationReason(reason);
        return request;
    }

    private User admin() {
        return user(ADMIN_ID, ADMIN_EMAIL, "Admin Test", "ADMIN");
    }

    private User owner() {
        return user(OWNER_ID, "owner@test.com", "Owner Test", "OWNER");
    }

    private User user(
            Integer userId,
            String email,
            String fullName,
            String roleName
    ) {
        Role role = new Role();
        role.setRoleName(roleName);

        User user = new User();
        user.setUserID(userId);
        user.setEmail(email);
        user.setPassword("password");
        user.setFullName(fullName);
        user.setStatus("ACTIVE");
        user.setRole(role);
        return user;
    }

    private Tournament tournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(TOURNAMENT_ID);
        tournament.setTournamentName("Summer Cup");
        tournament.setVenue("Central Track");
        tournament.setRegistrationOpenAt(LocalDateTime.now().minusDays(1));
        tournament.setRegistrationCloseAt(LocalDateTime.now().plusDays(1));
        tournament.setStartDate(LocalDate.now().plusDays(2));
        tournament.setEndDate(LocalDate.now().plusDays(3));
        tournament.setMaxRegistrations(20);
        tournament.setEntryFee(BigDecimal.valueOf(100));
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        tournament.setCreatedBy(ADMIN_ID);
        return tournament;
    }

    private Horse horse() {
        return Horse.builder()
                .horseId(HORSE_ID)
                .ownerId(OWNER_ID)
                .horseName("Lightning")
                .weight(BigDecimal.valueOf(450))
                .status("ACTIVE")
                .build();
    }
}
