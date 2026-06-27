package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.dto.request.CreateTournamentRequest;
import com.example.backend.dto.request.UpdateTournamentRequest;
import com.example.backend.dto.response.TournamentDetailResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RacePrizeRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class TournamentServiceTest {

    @Mock private TournamentRepository tournamentRepository;
    @Mock private TournamentConditionRepository conditionRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private RacePrizeRepository racePrizeRepository;
    @Mock private RaceEntryRepository raceEntryRepository;
    @Mock private RegistrationRepository registrationRepository;
    @Mock private UserRepository userRepository;
    @Mock private VenueImageStorageService venueImageStorageService;

    private TournamentService service;

    @BeforeEach
    void setUp() {
        service = new TournamentService(
                tournamentRepository,
                conditionRepository,
                raceRepository,
                racePrizeRepository,
                raceEntryRepository,
                registrationRepository,
                userRepository,
                venueImageStorageService
        );
    }

    @Test
    void createTournamentStartsOpenForRegistration() {
        CreateTournamentRequest request = validCreateRequest();
        User admin = activeAdmin();
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(admin));
        when(tournamentRepository.save(any(Tournament.class)))
                .thenAnswer(invocation -> {
                    Tournament saved = invocation.getArgument(0);
                    saved.setTournamentId(1);
                    return saved;
                });
        stubDetailCollections(1, List.of());

        TournamentDetailResponse response = service.createTournament(
                request,
                "admin@example.com"
        );

        ArgumentCaptor<Tournament> captor =
                ArgumentCaptor.forClass(Tournament.class);
        verify(tournamentRepository).save(captor.capture());
        assertEquals(EventStatus.OPEN_FOR_REGISTRATION,
                captor.getValue().getStatus());
        assertEquals(admin.getUserID(), captor.getValue().getCreatedBy());
        assertEquals("Summer Championship",
                captor.getValue().getTournamentName());
        assertEquals(EventStatus.OPEN_FOR_REGISTRATION,
                response.getStatus());
        verify(conditionRepository).saveAll(List.of());
    }

    @Test
    void createTournamentRejectsInvalidRegistrationWindow() {
        CreateTournamentRequest request = validCreateRequest();
        request.setRegistrationOpenAt(LocalDateTime.now().plusDays(2));
        request.setRegistrationCloseAt(LocalDateTime.now().plusDays(1));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createTournament(request, "admin@example.com")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(userRepository, never()).findByEmail(any());
        verify(tournamentRepository, never()).save(any());
    }

    @Test
    void updateTournamentFlushesDeletedConditionsBeforeSavingReplacements() {
        UpdateTournamentRequest request = validUpdateRequest();
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(registrationRepository.existsByTournamentId(1)).thenReturn(false);
        when(tournamentRepository.save(tournament)).thenReturn(tournament);
        stubDetailCollections(1, List.of());

        service.updateTournament(1, request, "admin@example.com");

        var order = inOrder(conditionRepository);
        order.verify(conditionRepository).deleteByTournamentId(1);
        order.verify(conditionRepository).flush();
        order.verify(conditionRepository).saveAll(any());
    }

    @Test
    void updateTournamentRejectsNonAdmin() {
        UpdateTournamentRequest request = validUpdateRequest();
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        User nonAdmin = new User();
        Role ownerRole = new Role();
        ownerRole.setRoleName("OWNER");
        nonAdmin.setRole(ownerRole);
        nonAdmin.setStatus("ACTIVE");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(nonAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.updateTournament(1, request, "owner@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(tournamentRepository, never()).save(any());
    }

    @Test
    void updateTournamentRejectsInactiveAdmin() {
        UpdateTournamentRequest request = validUpdateRequest();
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        User inactiveAdmin = activeAdmin();
        inactiveAdmin.setStatus("INACTIVE");
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(inactiveAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.updateTournament(1, request, "admin@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(tournamentRepository, never()).save(any());
    }

    @Test
    void uploadVenueImageUpdatesCloudinaryUrl() {
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        tournament.setVenueImageUrl("https://res.cloudinary.com/demo/old.jpg");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "venue.png",
                "image/png",
                new byte[]{1, 2, 3}
        );

        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(venueImageStorageService.store(1, file))
                .thenReturn("https://res.cloudinary.com/demo/new.png");
        when(tournamentRepository.save(tournament)).thenReturn(tournament);

        stubDetailCollections(1, List.of());

        TournamentDetailResponse response = service.uploadVenueImage(
                1,
                file,
                "admin@example.com"
        );

        assertEquals("https://res.cloudinary.com/demo/new.png", response.getVenueImageUrl());
        verify(venueImageStorageService).store(1, file);
        verify(venueImageStorageService, never()).delete(any(Integer.class));
    }

    @Test
    void removeVenueImageClearsUrlAndDeletesCloudinaryImage() {
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        tournament.setVenueImageUrl("https://res.cloudinary.com/demo/venue.webp");

        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(tournamentRepository.save(tournament)).thenReturn(tournament);

        stubDetailCollections(1, List.of());

        TournamentDetailResponse response = service.removeVenueImage(
                1,
                "admin@example.com"
        );

        assertEquals(null, response.getVenueImageUrl());
        verify(venueImageStorageService).delete(1);
    }

    @Test
    void closeRegistrationClosesTournamentAndOpenRaces() {
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        Race openRace = race(10, EventStatus.OPEN_FOR_REGISTRATION);
        Race completedRace = race(11, EventStatus.COMPLETED);
        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        when(raceRepository.findByTournamentIdOrderByRaceOrderAsc(1))
                .thenReturn(List.of(openRace, completedRace));
        when(tournamentRepository.save(tournament)).thenReturn(tournament);

        TournamentDetailResponse response = service.closeRegistration(1);

        assertEquals(EventStatus.REGISTRATION_CLOSED, tournament.getStatus());
        assertEquals(EventStatus.REGISTRATION_CLOSED, openRace.getStatus());
        assertEquals(EventStatus.COMPLETED, completedRace.getStatus());
        assertEquals(EventStatus.REGISTRATION_CLOSED, response.getStatus());
        verify(raceRepository).saveAll(List.of(openRace, completedRace));
    }

    @Test
    void cancelTournamentRejectsExistingRegistrations() {
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(registrationRepository.existsByTournamentId(1)).thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.cancelTournament(1, "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(tournamentRepository, never()).save(any());
        verify(raceRepository, never()).saveAll(any());
    }

    @Test
    void cancelTournamentRejectsNonAdmin() {
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        User nonAdmin = new User();
        Role ownerRole = new Role();
        ownerRole.setRoleName("OWNER");
        nonAdmin.setRole(ownerRole);
        nonAdmin.setStatus("ACTIVE");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(nonAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.cancelTournament(1, "owner@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(tournamentRepository, never()).save(any());
    }

    @Test
    void cancelTournamentCancelsAssignedRaceEntries() {
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        Race raceA = race(10, EventStatus.OPEN_FOR_REGISTRATION);
        Race raceB = race(11, EventStatus.REGISTRATION_CLOSED);

        com.example.backend.entity.RaceEntry entryA = new com.example.backend.entity.RaceEntry();
        entryA.setRaceEntryId(100);
        entryA.setRaceId(10);
        entryA.setStatus(com.example.backend.constant.RaceEntryStatus.ASSIGNED);

        com.example.backend.entity.RaceEntry entryB = new com.example.backend.entity.RaceEntry();
        entryB.setRaceEntryId(101);
        entryB.setRaceId(11);
        entryB.setStatus(com.example.backend.constant.RaceEntryStatus.ASSIGNED);

        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(registrationRepository.existsByTournamentId(1)).thenReturn(false);
        when(raceRepository.findByTournamentIdOrderByRaceOrderAsc(1))
                .thenReturn(List.of(raceA, raceB));
        when(raceEntryRepository.findByRaceIdInAndStatus(
                List.of(10, 11),
                com.example.backend.constant.RaceEntryStatus.ASSIGNED
        )).thenReturn(List.of(entryA, entryB));
        when(tournamentRepository.save(tournament)).thenReturn(tournament);
        stubDetailCollections(1, List.of(raceA, raceB));

        service.cancelTournament(1, "admin@example.com");

        assertEquals(com.example.backend.constant.RaceEntryStatus.CANCELLED, entryA.getStatus());
        assertNotNull(entryA.getCancelledAt());
        assertEquals("Tournament cancelled.", entryA.getCancellationReason());
        assertEquals(com.example.backend.constant.RaceEntryStatus.CANCELLED, entryB.getStatus());
        verify(raceEntryRepository).saveAll(List.of(entryA, entryB));
    }

    @Test
    void cancelTournamentWithNoRacesSkipsEntryUpdate() {
        Tournament tournament = tournament(1, EventStatus.OPEN_FOR_REGISTRATION);
        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(registrationRepository.existsByTournamentId(1)).thenReturn(false);
        when(raceRepository.findByTournamentIdOrderByRaceOrderAsc(1))
                .thenReturn(List.of());
        when(tournamentRepository.save(tournament)).thenReturn(tournament);
        stubDetailCollections(1, List.of());

        service.cancelTournament(1, "admin@example.com");

        verify(raceEntryRepository, never()).findByRaceIdInAndStatus(any(), any());
        verify(raceEntryRepository, never()).saveAll(any());
        assertEquals(EventStatus.CANCELLED, tournament.getStatus());
    }

    @Test
    void completeTournamentRequiresEveryRaceToBeCompleted() {
        Tournament tournament = tournament(1, EventStatus.REGISTRATION_CLOSED);
        when(tournamentRepository.findByIdForUpdate(1))
                .thenReturn(Optional.of(tournament));
        when(raceRepository.findByTournamentIdOrderByRaceOrderAsc(1))
                .thenReturn(List.of(race(10, EventStatus.IN_PROGRESS)));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.completeTournament(1)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(tournamentRepository, never()).save(any());
    }

    private CreateTournamentRequest validCreateRequest() {
        LocalDate start = LocalDate.now().plusDays(5);
        CreateTournamentRequest request = new CreateTournamentRequest();
        request.setTournamentName(" Summer Championship ");
        request.setDescription("Season opener");
        request.setVenue("Bangkok Track");
        request.setRegistrationOpenAt(LocalDateTime.now().plusDays(1));
        request.setRegistrationCloseAt(start.atStartOfDay().minusDays(1));
        request.setStartDate(start);
        request.setEndDate(start.plusDays(2));
        request.setMaxRegistrations(24);
        request.setEntryFee(new BigDecimal("1500.00"));
        request.setConditions(List.of());
        return request;
    }

    private UpdateTournamentRequest validUpdateRequest() {
        CreateTournamentRequest create = validCreateRequest();
        UpdateTournamentRequest request = new UpdateTournamentRequest();
        request.setTournamentName(create.getTournamentName());
        request.setDescription(create.getDescription());
        request.setVenue(create.getVenue());
        request.setRegistrationOpenAt(create.getRegistrationOpenAt());
        request.setRegistrationCloseAt(create.getRegistrationCloseAt());
        request.setStartDate(create.getStartDate());
        request.setEndDate(create.getEndDate());
        request.setMaxRegistrations(create.getMaxRegistrations());
        request.setEntryFee(create.getEntryFee());
        request.setConditions(create.getConditions());
        return request;
    }

    private User activeAdmin() {
        Role role = new Role();
        role.setRoleName("ADMIN");
        User admin = new User();
        admin.setUserID(99);
        admin.setEmail("admin@example.com");
        admin.setRole(role);
        admin.setStatus("ACTIVE");
        return admin;
    }

    private Tournament tournament(Integer id, String status) {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(id);
        tournament.setTournamentName("Summer Championship");
        tournament.setVenue("Bangkok Track");
        tournament.setRegistrationOpenAt(LocalDateTime.now().plusDays(1));
        tournament.setRegistrationCloseAt(LocalDateTime.now().plusDays(2));
        tournament.setStartDate(LocalDate.now().plusDays(3));
        tournament.setEndDate(LocalDate.now().plusDays(5));
        tournament.setMaxRegistrations(24);
        tournament.setEntryFee(new BigDecimal("1500.00"));
        tournament.setCreatedBy(99);
        tournament.setStatus(status);
        return tournament;
    }

    private Race race(Integer id, String status) {
        Race race = new Race();
        race.setRaceId(id);
        race.setTournamentId(1);
        race.setRaceName("Race " + id);
        race.setTrackName("Bangkok Track");
        race.setRaceStartTime(LocalDateTime.now().plusDays(4));
        race.setRaceEndTime(LocalDateTime.now().plusDays(4).plusHours(1));
        race.setDistance(1200);
        race.setMaxRunners(12);
        race.setRaceOrder(id - 9);
        race.setStatus(status);
        return race;
    }

    private void stubDetailCollections(Integer tournamentId, List<Race> races) {
        when(raceRepository.findByTournamentIdOrderByRaceOrderAsc(tournamentId))
                .thenReturn(races);
        when(conditionRepository.findByTournamentIdOrderByConditionIdAsc(tournamentId))
                .thenReturn(List.of());
    }
}
