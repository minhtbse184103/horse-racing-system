package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.dto.request.FailRaceRunRequest;
import com.example.backend.dto.response.RaceLaunchResponse;
import com.example.backend.dto.response.RaceRunRecoveryResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceEngineLaunchServiceTest {

    private static final Integer ADMIN_ID = 1;
    private static final Integer RACE_ID = 20;
    private static final String ADMIN_EMAIL = "admin@test.com";

    @Mock
    private RaceRepository raceRepository;
    @Mock
    private RaceEntryRepository raceEntryRepository;
    @Mock
    private RaceResultRepository raceResultRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RaceEngineTokenService raceEngineTokenService;
    @Mock
    private RaceEngineProcessLauncher raceEngineProcessLauncher;

    private RaceEngineLaunchService raceEngineLaunchService;

    @BeforeEach
    void setUp() {
        raceEngineLaunchService = new RaceEngineLaunchService(
                raceRepository,
                raceEntryRepository,
                raceResultRepository,
                userRepository,
                raceEngineTokenService,
                raceEngineProcessLauncher
        );
    }

    @Test
    void launchRaceMarksRaceLaunchedAndStartsUnityEngine() {
        Race race = launchableRace();
        stubAdmin();
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race));
        when(raceEntryRepository.countByRaceIdAndStatus(
                RACE_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(2L);
        when(raceEngineTokenService.generateToken())
                .thenReturn("launch-token");

        RaceLaunchResponse response =
                raceEngineLaunchService.launchRace(RACE_ID, ADMIN_EMAIL);

        ArgumentCaptor<Race> captor = ArgumentCaptor.forClass(Race.class);
        verify(raceRepository).saveAndFlush(captor.capture());
        Race saved = captor.getValue();

        assertEquals(ADMIN_ID, saved.getRunTriggeredBy());
        assertNotNull(saved.getRunStartedAt());
        assertEquals("launch-token", saved.getRaceEngineToken());
        assertNotNull(saved.getRaceEngineTokenIssuedAt());
        assertEquals(EventStatus.IN_PROGRESS, saved.getStatus());
        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(EventStatus.IN_PROGRESS, response.getStatus());
        assertEquals("launch-token", response.getRaceEngineToken());
        assertNotNull(response.getLaunchedAt());
        verify(raceEngineProcessLauncher).launch(RACE_ID, "launch-token");
    }

    @Test
    void launchRaceRejectsDoubleLaunch() {
        Race race = launchableRace();
        race.setRunStartedAt(LocalDateTime.now().minusMinutes(5));
        stubAdmin();
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineLaunchService.launchRace(RACE_ID, ADMIN_EMAIL)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceRepository, never()).saveAndFlush(any());
        verify(raceEngineProcessLauncher, never()).launch(any(), any());
    }

    @Test
    void failLaunchedRaceSetsCancelledStatus() {
        Race race = launchedRace();
        stubAdmin();
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race));
        when(raceEntryRepository.findByRaceIdAndStatusOrderByStartingStallAsc(
                RACE_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(List.of(assignedEntry(1, 1), assignedEntry(2, 2)));
        when(raceResultRepository.existsByRaceEntryIdIn(List.of(1, 2)))
                .thenReturn(false);

        RaceRunRecoveryResponse response = raceEngineLaunchService
                .failLaunchedRace(
                        RACE_ID,
                        failRequest("  Unity stopped responding  "),
                        ADMIN_EMAIL
                );

        ArgumentCaptor<Race> captor = ArgumentCaptor.forClass(Race.class);
        verify(raceRepository).save(captor.capture());

        assertEquals(EventStatus.CANCELLED, captor.getValue().getStatus());
        assertEquals(null, captor.getValue().getRaceEngineToken());
        assertEquals(EventStatus.CANCELLED, response.getStatus());
        assertEquals("Unity stopped responding", response.getReason());
        assertNotNull(response.getRecoveredAt());
    }

    @Test
    void failLaunchedRaceRejectsRaceWithRecordedResult() {
        Race race = launchedRace();
        stubAdmin();
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race));
        when(raceEntryRepository.findByRaceIdAndStatusOrderByStartingStallAsc(
                RACE_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(List.of(assignedEntry(1, 1)));
        when(raceResultRepository.existsByRaceEntryIdIn(List.of(1)))
                .thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineLaunchService.failLaunchedRace(
                        RACE_ID,
                        failRequest("Already finished"),
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceRepository, never()).save(any());
    }

    @Test
    void failLaunchedRaceRejectsBlankReason() {
        stubAdmin();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineLaunchService.failLaunchedRace(
                        RACE_ID,
                        failRequest("   "),
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void failLaunchedRaceRejectsNotLaunchedRace() {
        Race race = launchableRace();
        stubAdmin();
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceEngineLaunchService.failLaunchedRace(
                        RACE_ID,
                        failRequest("No launch"),
                        ADMIN_EMAIL
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceRepository, never()).save(any());
    }

    private void stubAdmin() {
        when(userRepository.findByEmail(ADMIN_EMAIL))
                .thenReturn(Optional.of(admin()));
    }

    private Race launchableRace() {
        Race race = new Race();
        race.setRaceId(RACE_ID);
        race.setTournamentId(10);
        race.setRaceName("Live Test");
        race.setTrackName("Main Track");
        race.setRaceStartTime(LocalDateTime.now().minusMinutes(2));
        race.setRaceEndTime(LocalDateTime.now().plusMinutes(58));
        race.setDistance(1200);
        race.setMaxRunners(6);
        race.setRaceOrder(1);
        race.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        return race;
    }

    private Race launchedRace() {
        Race race = launchableRace();
        race.setStatus(EventStatus.IN_PROGRESS);
        race.setRunTriggeredBy(ADMIN_ID);
        race.setRunStartedAt(LocalDateTime.now().minusMinutes(5));
        return race;
    }

    private RaceEntry assignedEntry(Integer raceEntryId, Integer stall) {
        RaceEntry entry = new RaceEntry();
        entry.setRaceEntryId(raceEntryId);
        entry.setRaceId(RACE_ID);
        entry.setRegistrationId(100 + raceEntryId);
        entry.setStartingStall(stall);
        entry.setStatus(RaceEntryStatus.ASSIGNED);
        entry.setAssignedBy(ADMIN_ID);
        entry.setAssignedAt(LocalDateTime.now().minusHours(1));
        return entry;
    }

    private FailRaceRunRequest failRequest(String reason) {
        FailRaceRunRequest request = new FailRaceRunRequest();
        request.setReason(reason);
        return request;
    }

    private User admin() {
        Role role = new Role();
        role.setRoleName("ADMIN");

        User user = new User();
        user.setUserID(ADMIN_ID);
        user.setEmail(ADMIN_EMAIL);
        user.setPassword("password");
        user.setUsername("Admin Test");
        user.setStatus("ACTIVE");
        user.setRole(role);
        return user;
    }
}
