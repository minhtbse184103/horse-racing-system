package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.dto.request.RacePrizeRequest;
import com.example.backend.dto.request.UpdateRaceRequest;
import com.example.backend.dto.response.RaceResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RacePrize;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RacePrizeRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceServiceTest {

    @Mock private RaceRepository raceRepository;
    @Mock private TournamentRepository tournamentRepository;
    @Mock private RacePrizeRepository racePrizeRepository;
    @Mock private RaceEntryRepository raceEntryRepository;
    @Mock private RaceResultRepository raceResultRepository;
    @Mock private UserRepository userRepository;
    @Mock private RaceRunWatchdogService raceRunWatchdogService;

    private RaceService service;

    @BeforeEach
    void setUp() {
        service = new RaceService(
                raceRepository,
                racePrizeRepository,
                raceEntryRepository,
                raceResultRepository,
                tournamentRepository,
                userRepository,
                raceRunWatchdogService
        );
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

    private void stubAdmin() {
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
    }

    @Test
    void updateRaceFlushesDeletedPrizesBeforeSavingReplacements() {
        Race race = race();
        Tournament tournament = tournament();
        UpdateRaceRequest request = updateRequest();

        stubAdmin();
        when(raceRepository.findByIdForUpdate(8)).thenReturn(Optional.of(race));
        when(tournamentRepository.findByIdForUpdate(12))
                .thenReturn(Optional.of(tournament));
        when(raceRepository
                .existsByTournamentIdAndRaceNameIgnoreCaseAndRaceIdNot(
                        12,
                        request.getRaceName(),
                        8
                )).thenReturn(false);
        when(raceRepository
                .existsByTournamentIdAndRaceOrderAndRaceIdNot(12, 1, 8))
                .thenReturn(false);
        when(raceEntryRepository.countByRaceIdAndStatus(
                8,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(0L);
        when(raceRepository.saveAndFlush(race)).thenReturn(race);
        RacePrize storedPrize = prize();
        when(racePrizeRepository.saveAll(any())).thenReturn(List.of(storedPrize));
        when(racePrizeRepository.findByRaceIdOrderByRankPositionAsc(8))
                .thenReturn(List.of(storedPrize));

        RaceResponse response = service.updateRace(8, request, "admin@example.com");

        InOrder order = inOrder(racePrizeRepository);
        order.verify(racePrizeRepository).deleteByRaceId(8);
        order.verify(racePrizeRepository).flush();
        order.verify(racePrizeRepository).saveAll(any());
        assertEquals(new BigDecimal("80"), response.getPrizes().getFirst().getOwnerPercent());
        assertEquals(new BigDecimal("20"), response.getPrizes().getFirst().getJockeyPercent());
    }

    @Test
    void updateRaceRejectsPrizeSplitThatDoesNotTotalOneHundred() {
        Race race = race();
        Tournament tournament = tournament();
        UpdateRaceRequest request = updateRequest();
        request.getPrizes().getFirst().setOwnerPercent(new BigDecimal("70"));
        request.getPrizes().getFirst().setJockeyPercent(new BigDecimal("20"));

        stubAdmin();
        when(raceRepository.findByIdForUpdate(8)).thenReturn(Optional.of(race));
        when(tournamentRepository.findByIdForUpdate(12))
                .thenReturn(Optional.of(tournament));

        var exception = assertThrows(
                com.example.backend.exception.ApiException.class,
                () -> service.updateRace(8, request, "admin@example.com")
        );

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(racePrizeRepository, never()).saveAll(any());
    }

    @Test
    void updateRaceRejectsReadyRace() {
        Race race = race();
        race.setStatus(EventStatus.READY);
        UpdateRaceRequest request = updateRequest();

        stubAdmin();
        when(raceRepository.findByIdForUpdate(8)).thenReturn(Optional.of(race));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.updateRace(8, request, "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("Race can no longer be modified.", exception.getMessage());
        verify(tournamentRepository, never()).findByIdForUpdate(any());
        verify(raceRepository, never()).saveAndFlush(any());
    }

    @Test
    void updateRaceRejectsNonAdmin() {
        UpdateRaceRequest request = updateRequest();

        User nonAdmin = new User();
        Role ownerRole = new Role();
        ownerRole.setRoleName("OWNER");
        nonAdmin.setRole(ownerRole);
        nonAdmin.setStatus("ACTIVE");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(nonAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.updateRace(8, request, "owner@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(raceRepository, never()).saveAndFlush(any());
    }

    @Test
    void closeRegistrationRejectsNonAdmin() {
        User nonAdmin = new User();
        Role jockeyRole = new Role();
        jockeyRole.setRoleName("JOCKEY");
        nonAdmin.setRole(jockeyRole);
        nonAdmin.setStatus("ACTIVE");
        when(userRepository.findByEmail("jockey@example.com"))
                .thenReturn(Optional.of(nonAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.closeRegistration(8, "jockey@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(raceRepository, never()).findByIdForUpdate(any());
        verify(raceRepository, never()).save(any());
    }

    @Test
    void cancelRaceRejectsInactiveAdmin() {
        User inactiveAdmin = activeAdmin();
        inactiveAdmin.setStatus("SUSPENDED");
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(inactiveAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.cancelRace(8, "admin@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(raceRepository, never()).findByIdForUpdate(any());
        verify(raceRepository, never()).save(any());
    }

    @Test
    void cancelRaceAllowsReadyRaceWithNoRaceEntryHistory() {
        Race race = race();
        race.setStatus(EventStatus.READY);

        stubAdmin();
        when(raceRepository.findByIdForUpdate(8)).thenReturn(Optional.of(race));
        when(raceEntryRepository.existsByRaceId(8)).thenReturn(false);
        when(raceRepository.save(race)).thenReturn(race);
        when(raceEntryRepository.countByRaceIdAndStatus(8, RaceEntryStatus.ASSIGNED))
                .thenReturn(0L);
        when(racePrizeRepository.findByRaceIdOrderByRankPositionAsc(8))
                .thenReturn(List.of());

        RaceResponse response = service.cancelRace(8, "admin@example.com");

        assertEquals(EventStatus.CANCELLED, response.getStatus());
        verify(raceEntryRepository, never()).saveAll(any());
    }

    @Test
    void cancelRaceRejectsReadyRaceWithRaceEntryHistory() {
        Race race = race();
        race.setStatus(EventStatus.READY);
        RaceEntry entry = new RaceEntry();
        entry.setRaceEntryId(44);
        entry.setRaceId(8);
        entry.setStatus(RaceEntryStatus.ASSIGNED);

        stubAdmin();
        when(raceRepository.findByIdForUpdate(8)).thenReturn(Optional.of(race));
        when(raceEntryRepository.existsByRaceId(8)).thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.cancelRace(8, "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Race cannot be cancelled after entries have been assigned.",
                exception.getMessage()
        );
        assertEquals(RaceEntryStatus.ASSIGNED, entry.getStatus());
        verify(raceEntryRepository, never()).saveAll(any());
        verify(raceRepository, never()).save(any());
    }

    private Tournament tournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(12);
        tournament.setStartDate(LocalDate.now().plusDays(1));
        tournament.setEndDate(LocalDate.now().plusDays(5));
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        return tournament;
    }

    private Race race() {
        Race race = new Race();
        race.setRaceId(8);
        race.setTournamentId(12);
        race.setRaceName("Race test 1");
        race.setTrackName("Test 1");
        race.setRaceStartTime(LocalDate.now().plusDays(1).atTime(9, 0));
        race.setRaceEndTime(LocalDate.now().plusDays(1).atTime(10, 0));
        race.setDistance(1600);
        race.setMaxRunners(5);
        race.setRaceOrder(1);
        race.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        return race;
    }

    private UpdateRaceRequest updateRequest() {
        RacePrizeRequest firstPrize = new RacePrizeRequest();
        firstPrize.setRankPosition(1);
        firstPrize.setAmount(new BigDecimal("50000"));
        firstPrize.setOwnerPercent(new BigDecimal("80"));
        firstPrize.setJockeyPercent(new BigDecimal("20"));

        UpdateRaceRequest request = new UpdateRaceRequest();
        request.setRaceName("Race test 1");
        request.setTrackName("Test 1");
        request.setRaceStartTime(LocalDate.now().plusDays(1).atTime(9, 0));
        request.setRaceEndTime(LocalDate.now().plusDays(1).atTime(10, 0));
        request.setDistance(1600);
        request.setMaxRunners(5);
        request.setRaceOrder(1);
        request.setPrizes(List.of(firstPrize));
        return request;
    }

    private RacePrize prize() {
        RacePrize prize = new RacePrize();
        prize.setRacePrizeId(1);
        prize.setRaceId(8);
        prize.setRankPosition(1);
        prize.setAmount(new BigDecimal("50000"));
        prize.setOwnerPercent(new BigDecimal("80"));
        prize.setJockeyPercent(new BigDecimal("20"));
        return prize;
    }
}
