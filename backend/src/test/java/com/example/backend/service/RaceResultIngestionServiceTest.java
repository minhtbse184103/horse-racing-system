package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RaceResultSubmissionStatus;
import com.example.backend.dto.request.RaceResultEntryRequest;
import com.example.backend.dto.request.RaceResultIngestRequest;
import com.example.backend.dto.response.RaceResultIngestResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RaceResultSubmission;
import com.example.backend.entity.RaceResultSubmissionEntry;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RaceResultSubmissionEntryRepository;
import com.example.backend.repository.RaceResultSubmissionRepository;
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
    private RaceResultSubmissionRepository submissionRepository;
    @Mock
    private RaceResultSubmissionEntryRepository submissionEntryRepository;

    private RaceResultIngestionService raceResultIngestionService;

    @BeforeEach
    void setUp() {
        raceResultIngestionService = new RaceResultIngestionService(
                raceRepository,
                raceEntryRepository,
                raceResultRepository,
                raceEngineTokenService,
                submissionRepository,
                submissionEntryRepository
        );
    }

    @Test
    void ingestResultSuccessSavesSubmissionAndMovesRaceToPendingReview() {
        Race race = launchedRace();
        List<RaceEntry> entries = List.of(
                assignedEntry(1, 1),
                assignedEntry(2, 2)
        );
        stubRaceAndEntries(race, entries);
        when(submissionRepository.existsByRaceId(RACE_ID)).thenReturn(false);
        when(raceResultRepository.existsByRaceEntryIdIn(List.of(1, 2)))
                .thenReturn(false);
        when(submissionRepository.save(any(RaceResultSubmission.class)))
                .thenAnswer(invocation -> {
                    RaceResultSubmission submission = invocation.getArgument(0);
                    submission.setSubmissionId(50);
                    return submission;
                });

        RaceResultIngestResponse response =
                raceResultIngestionService.ingestResult(
                        RACE_ID,
                        "launch-token",
                        resultRequest(resultEntry(1, 1), resultEntry(2, 2))
                );

        ArgumentCaptor<RaceResultSubmission> submissionCaptor =
                ArgumentCaptor.forClass(RaceResultSubmission.class);
        verify(submissionRepository).save(submissionCaptor.capture());
        RaceResultSubmission savedSubmission = submissionCaptor.getValue();
        assertEquals(RACE_ID, savedSubmission.getRaceId());
        assertEquals(ADMIN_ID, savedSubmission.getSubmittedBy());
        assertEquals(RaceResultSubmissionStatus.SUBMITTED,
                savedSubmission.getStatus());
        assertNotNull(savedSubmission.getSubmittedAt());

        ArgumentCaptor<List<RaceResultSubmissionEntry>> captor =
                ArgumentCaptor.forClass(List.class);
        verify(submissionEntryRepository).saveAll(captor.capture());

        List<RaceResultSubmissionEntry> savedEntries = captor.getValue();
        assertEquals(2, savedEntries.size());
        assertEquals(50, savedEntries.get(0).getSubmissionId());
        assertEquals(1, savedEntries.get(0).getRaceEntryId());
        assertEquals(1, savedEntries.get(0).getStartingStall());
        assertEquals(1, savedEntries.get(0).getFinishPosition());
        verify(raceResultRepository, never()).saveAll(any());
        assertEquals(EventStatus.PENDING_REVIEW, race.getStatus());
        assertEquals(null, race.getRaceEngineToken());
        verify(raceRepository).save(race);
        assertEquals(50, response.getSubmissionId());
        assertEquals(EventStatus.PENDING_REVIEW, response.getStatus());
        assertEquals(RaceResultSubmissionStatus.SUBMITTED,
                response.getReviewStatus());
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
        verify(submissionRepository, never()).save(any());
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
        verify(submissionRepository, never()).save(any());
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
        verify(submissionRepository, never()).save(any());
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
        verify(submissionRepository, never()).save(any());
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
        verify(submissionRepository, never()).save(any());
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
        verify(submissionRepository, never()).save(any());
        verify(raceResultRepository, never()).saveAll(any());
    }

    @Test
    void ingestResultRejectsResubmissionWhenSubmissionExists() {
        Race race = launchedRace();
        stubRaceAndEntries(race, List.of(assignedEntry(1, 1)));
        when(submissionRepository.existsByRaceId(RACE_ID))
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
        verify(raceResultRepository, never()).existsByRaceEntryIdIn(any());
        verify(submissionRepository, never()).save(any());
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

    @Test
    void ingestResultRejectsRaceThatIsReadyButNotInProgress() {
        Race race = launchedRace();
        race.setStatus(EventStatus.READY);
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
        assertEquals(
                "Race must be in progress before results can be recorded.",
                exception.getMessage()
        );
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
