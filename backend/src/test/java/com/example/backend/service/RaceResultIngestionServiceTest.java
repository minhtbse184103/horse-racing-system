package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.dto.request.RaceResultEntryRequest;
import com.example.backend.dto.request.RaceResultIngestRequest;
import com.example.backend.dto.response.RaceResultIngestResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RaceResult;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
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
class RaceResultIngestionServiceTest {

    private static final Integer ADMIN_ID = 1;
    private static final Integer RACE_ID = 20;

    @Mock
    private RaceRepository raceRepository;
    @Mock
    private RaceEntryRepository raceEntryRepository;
    @Mock
    private RaceResultRepository raceResultRepository;
    @Mock
    private RaceEngineTokenService raceEngineTokenService;
    @Mock
    private RacePrizeSettlementService racePrizeSettlementService;

    private RaceResultIngestionService raceResultIngestionService;

    @BeforeEach
    void setUp() {
        raceResultIngestionService = new RaceResultIngestionService(
                raceRepository,
                raceEntryRepository,
                raceResultRepository,
                raceEngineTokenService,
                racePrizeSettlementService
        );
    }

    @Test
    void ingestResultSuccessSavesResultsAndCompletesRace() {
        Race race = launchedRace();
        List<RaceEntry> entries = List.of(
                assignedEntry(1, 1),
                assignedEntry(2, 2)
        );
        stubRaceAndEntries(race, entries);
        when(raceResultRepository.existsByRaceEntryIdIn(List.of(1, 2)))
                .thenReturn(false);

        RaceResultIngestResponse response =
                raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 1), resultEntry(2, 2))
                );

        ArgumentCaptor<List<RaceResult>> captor =
                ArgumentCaptor.forClass(List.class);
        verify(raceResultRepository).saveAll(captor.capture());

        List<RaceResult> savedResults = captor.getValue();
        assertEquals(2, savedResults.size());
        assertEquals(1, savedResults.get(0).getRaceEntryId());
        assertEquals(1, savedResults.get(0).getFinishPosition());
        assertEquals(ADMIN_ID, savedResults.get(0).getRecordedBy());
        assertNotNull(savedResults.get(0).getRecordedAt());
        verify(racePrizeSettlementService).settlePrizes(
                any(),
                any(),
                any()
        );
        assertEquals(EventStatus.COMPLETED, race.getStatus());
        assertEquals(null, race.getRaceEngineToken());
        verify(raceRepository).save(race);
        assertEquals(EventStatus.COMPLETED, response.getStatus());
        assertNotNull(response.getRecordedAt());
    }

    @Test
    void ingestResultRejectsMismatchedEntryCount() {
        Race race = launchedRace();
        stubRaceAndEntries(race, List.of(
                assignedEntry(1, 1),
                assignedEntry(2, 2)
        ));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 1))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
    }

    @Test
    void ingestResultRejectsDuplicateStartingStall() {
        Race race = launchedRace();
        stubRaceAndEntries(race, List.of(
                assignedEntry(1, 1),
                assignedEntry(2, 2)
        ));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 1), resultEntry(1, 2))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
    }

    @Test
    void ingestResultRejectsDuplicateFinishPosition() {
        Race race = launchedRace();
        stubRaceAndEntries(race, List.of(
                assignedEntry(1, 1),
                assignedEntry(2, 2)
        ));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 1), resultEntry(2, 1))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
    }

    @Test
    void ingestResultRejectsFinishPositionBelowOne() {
        Race race = launchedRace();
        stubRaceAndEntries(race, List.of(assignedEntry(1, 1)));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 0))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
    }

    @Test
    void ingestResultRejectsNonContiguousFinishPositions() {
        Race race = launchedRace();
        stubRaceAndEntries(race, List.of(
                assignedEntry(1, 1),
                assignedEntry(2, 2)
        ));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 1), resultEntry(2, 3))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
    }

    @Test
    void ingestResultRejectsUnassignedStartingStall() {
        Race race = launchedRace();
        stubRaceAndEntries(race, List.of(assignedEntry(1, 1)));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(6, 1))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
    }

    @Test
    void ingestResultRejectsResubmissionWhenResultExists() {
        Race race = launchedRace();
        stubRaceAndEntries(race, List.of(assignedEntry(1, 1)));
        when(raceResultRepository.existsByRaceEntryIdIn(List.of(1)))
                .thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 1))
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
    }

    @Test
    void ingestResultRejectsRaceNotLaunched() {
        Race race = launchedRace();
        race.setRunStartedAt(null);
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 1))
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceEntryRepository, never())
                .findByRaceIdAndStatusOrderByStartingStallAsc(any(), any());
    }

    private void stubRaceAndEntries(Race race, List<RaceEntry> entries) {
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race));
        when(raceEntryRepository.findByRaceIdAndStatusOrderByStartingStallAsc(
                RACE_ID,
                RaceEntryStatus.ASSIGNED
        )).thenReturn(entries);
    }

    private Race launchedRace() {
        Race race = new Race();
        race.setRaceId(RACE_ID);
        race.setTournamentId(10);
        race.setRaceName("Live Test");
        race.setTrackName("Main Track");
        race.setRaceStartTime(LocalDateTime.now().minusMinutes(10));
        race.setRaceEndTime(LocalDateTime.now().plusMinutes(50));
        race.setDistance(1200);
        race.setMaxRunners(6);
        race.setRaceOrder(1);
        race.setStatus(EventStatus.IN_PROGRESS);
        race.setRunTriggeredBy(ADMIN_ID);
        race.setRunStartedAt(LocalDateTime.now().minusMinutes(5));
        race.setRaceEngineToken("launch-token");
        race.setRaceEngineTokenIssuedAt(LocalDateTime.now().minusMinutes(5));
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

    private RaceResultIngestRequest resultRequest(
            RaceResultEntryRequest... entries
    ) {
        RaceResultIngestRequest request = new RaceResultIngestRequest();
        request.setEntries(List.of(entries));
        return request;
    }

    private RaceResultEntryRequest resultEntry(
            Integer startingStall,
            Integer finishPosition
    ) {
        RaceResultEntryRequest request = new RaceResultEntryRequest();
        request.setStartingStall(startingStall);
        request.setFinishPosition(finishPosition);
        request.setFinishTime("00:00:" + (50 + finishPosition));
        return request;
    }
}
