package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceResultReviewActionType;
import com.example.backend.constant.RaceResultSubmissionStatus;
import com.example.backend.dto.request.AdminRaceResultReviewRequest;
import com.example.backend.dto.response.RaceResultSubmissionDetailResponse;
import com.example.backend.dto.response.RaceResultSubmissionSummaryResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RaceResult;
import com.example.backend.entity.RaceResultReviewAction;
import com.example.backend.entity.RaceResultSubmission;
import com.example.backend.entity.RaceResultSubmissionEntry;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RaceResultReviewActionRepository;
import com.example.backend.repository.RaceResultSubmissionEntryRepository;
import com.example.backend.repository.RaceResultSubmissionRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminRaceResultReviewServiceTest {

    private static final Integer ADMIN_ID = 3;
    private static final Integer RACE_ID = 20;
    private static final Integer SUBMISSION_ID = 50;
    private static final Integer FIRST_RACE_ENTRY_ID = 100;
    private static final Integer SECOND_RACE_ENTRY_ID = 101;

    @Mock
    private RaceResultSubmissionRepository submissionRepository;
    @Mock
    private RaceResultSubmissionEntryRepository entryRepository;
    @Mock
    private RaceResultReviewActionRepository reviewActionRepository;
    @Mock
    private RaceResultRepository raceResultRepository;
    @Mock
    private RaceEntryRepository raceEntryRepository;
    @Mock
    private RaceRepository raceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RacePrizeSettlementService prizeSettlementService;

    private AdminRaceResultReviewService service;

    @BeforeEach
    void setUp() {
        service = new AdminRaceResultReviewService(
                submissionRepository,
                entryRepository,
                reviewActionRepository,
                raceResultRepository,
                raceEntryRepository,
                raceRepository,
                userRepository,
                prizeSettlementService
        );
    }

    @Test
    void getReviewQueueReturnsRefereeReviewedSubmissions() {
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(submissionRepository.findAdminReviewQueue(List.of(
                RaceResultSubmissionStatus.REFEREE_CONFIRMED,
                RaceResultSubmissionStatus.REFEREE_FLAGGED
        ))).thenReturn(List.of(submission(
                RaceResultSubmissionStatus.REFEREE_CONFIRMED
        )));
        when(raceRepository.findById(RACE_ID)).thenReturn(Optional.of(race()));

        List<RaceResultSubmissionSummaryResponse> response =
                service.getReviewQueue("admin@example.com");

        assertEquals(1, response.size());
        assertEquals(SUBMISSION_ID, response.get(0).getSubmissionId());
        assertEquals(RaceResultSubmissionStatus.REFEREE_CONFIRMED,
                response.get(0).getStatus());
    }

    @Test
    void approveSubmissionCreatesOfficialResultsAndSettlesPrizes() {
        stubApproveAccess(EventStatus.PENDING_REVIEW, false, true);
        when(raceResultRepository.saveAll(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(submissionRepository.save(any(RaceResultSubmission.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        AdminRaceResultReviewRequest request = reviewRequest(" Approved ");

        RaceResultSubmissionDetailResponse response =
                service.approveSubmission(
                        SUBMISSION_ID,
                        request,
                        "admin@example.com"
                );

        ArgumentCaptor<List<RaceResult>> resultCaptor =
                ArgumentCaptor.forClass(List.class);
        verify(raceResultRepository).saveAll(resultCaptor.capture());
        List<RaceResult> savedResults = resultCaptor.getValue();
        assertEquals(2, savedResults.size());
        assertEquals(FIRST_RACE_ENTRY_ID, savedResults.get(0).getRaceEntryId());
        assertEquals(1, savedResults.get(0).getFinishPosition());
        assertEquals(ADMIN_ID, savedResults.get(0).getRecordedBy());
        assertNotNull(savedResults.get(0).getRecordedAt());

        verify(prizeSettlementService).settlePrizes(
                eq(RACE_ID),
                eq(savedResults),
                any()
        );

        ArgumentCaptor<Race> raceCaptor = ArgumentCaptor.forClass(Race.class);
        verify(raceRepository).save(raceCaptor.capture());
        assertEquals(EventStatus.COMPLETED, raceCaptor.getValue().getStatus());

        ArgumentCaptor<RaceResultSubmission> submissionCaptor =
                ArgumentCaptor.forClass(RaceResultSubmission.class);
        verify(submissionRepository).save(submissionCaptor.capture());
        RaceResultSubmission savedSubmission = submissionCaptor.getValue();
        assertEquals(RaceResultSubmissionStatus.ADMIN_APPROVED,
                savedSubmission.getStatus());
        assertEquals(ADMIN_ID, savedSubmission.getAdminReviewedBy());
        assertEquals("Approved", savedSubmission.getAdminComment());
        assertNotNull(savedSubmission.getAdminReviewedAt());

        ArgumentCaptor<RaceResultReviewAction> actionCaptor =
                ArgumentCaptor.forClass(RaceResultReviewAction.class);
        verify(reviewActionRepository).save(actionCaptor.capture());
        assertEquals(RaceResultReviewActionType.APPROVE,
                actionCaptor.getValue().getAction());
        assertEquals("ADMIN", actionCaptor.getValue().getActorRole());

        assertEquals(RaceResultSubmissionStatus.ADMIN_APPROVED,
                response.getStatus());
    }

    @Test
    void rejectSubmissionRequiresReason() {
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(submissionRepository.findByIdForUpdate(SUBMISSION_ID))
                .thenReturn(Optional.of(submission(
                        RaceResultSubmissionStatus.REFEREE_FLAGGED
                )));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.rejectSubmission(
                        SUBMISSION_ID,
                        reviewRequest(" "),
                        "admin@example.com"
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
        verify(prizeSettlementService, never()).settlePrizes(any(), any(), any());
        verify(submissionRepository, never()).save(any());
    }

    @Test
    void rejectSubmissionDoesNotCreateOfficialResultsOrCompleteRace() {
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(submissionRepository.findByIdForUpdate(SUBMISSION_ID))
                .thenReturn(Optional.of(submission(
                        RaceResultSubmissionStatus.REFEREE_FLAGGED
                )));
        when(submissionRepository.save(any(RaceResultSubmission.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(raceRepository.findById(RACE_ID)).thenReturn(Optional.of(race()));
        when(entryRepository.findBySubmissionIdOrderByFinishPositionAsc(
                SUBMISSION_ID
        )).thenReturn(submissionEntries());
        when(reviewActionRepository.findBySubmissionIdOrderByCreatedAtAsc(
                SUBMISSION_ID
        )).thenReturn(List.of());

        RaceResultSubmissionDetailResponse response =
                service.rejectSubmission(
                        SUBMISSION_ID,
                        reviewRequest("Invalid finish order"),
                        "admin@example.com"
                );

        verify(raceResultRepository, never()).saveAll(any());
        verify(prizeSettlementService, never()).settlePrizes(any(), any(), any());
        verify(raceRepository, never()).save(any());

        ArgumentCaptor<RaceResultSubmission> submissionCaptor =
                ArgumentCaptor.forClass(RaceResultSubmission.class);
        verify(submissionRepository).save(submissionCaptor.capture());
        assertEquals(RaceResultSubmissionStatus.ADMIN_REJECTED,
                submissionCaptor.getValue().getStatus());
        assertEquals("Invalid finish order",
                submissionCaptor.getValue().getAdminComment());

        ArgumentCaptor<RaceResultReviewAction> actionCaptor =
                ArgumentCaptor.forClass(RaceResultReviewAction.class);
        verify(reviewActionRepository).save(actionCaptor.capture());
        assertEquals(RaceResultReviewActionType.REJECT,
                actionCaptor.getValue().getAction());

        assertEquals(RaceResultSubmissionStatus.ADMIN_REJECTED,
                response.getStatus());
    }

    @Test
    void approveRejectsWhenOfficialResultAlreadyExists() {
        stubApproveAccess(EventStatus.PENDING_REVIEW, true, false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.approveSubmission(
                        SUBMISSION_ID,
                        reviewRequest(null),
                        "admin@example.com"
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
        verify(prizeSettlementService, never()).settlePrizes(any(), any(), any());
        verify(raceRepository, never()).save(any());
    }

    @Test
    void approveRejectsCancelledRace() {
        stubApproveAccess(EventStatus.CANCELLED, false, false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.approveSubmission(
                        SUBMISSION_ID,
                        reviewRequest(null),
                        "admin@example.com"
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceResultRepository, never()).saveAll(any());
        verify(prizeSettlementService, never()).settlePrizes(any(), any(), any());
    }

    @Test
    void approveRequiresActiveAdmin() {
        User inactive = activeAdmin();
        inactive.setStatus("INACTIVE");
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(inactive));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getReviewQueue("admin@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(submissionRepository, never()).findAdminReviewQueue(any());
    }

    private void stubApproveAccess(
            String raceStatus,
            boolean officialResultExists,
            boolean includeDetailMappingStubs
    ) {
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
        when(submissionRepository.findByIdForUpdate(SUBMISSION_ID))
                .thenReturn(Optional.of(submission(
                        RaceResultSubmissionStatus.REFEREE_CONFIRMED
                )));
        when(raceRepository.findByIdForUpdate(RACE_ID))
                .thenReturn(Optional.of(race(raceStatus)));

        if (!EventStatus.CANCELLED.equals(raceStatus)
                && !EventStatus.COMPLETED.equals(raceStatus)) {
            when(entryRepository.findBySubmissionIdOrderByFinishPositionAsc(
                    SUBMISSION_ID
            )).thenReturn(submissionEntries());
            when(raceResultRepository.existsByRaceEntryIdIn(List.of(
                    FIRST_RACE_ENTRY_ID,
                    SECOND_RACE_ENTRY_ID
            ))).thenReturn(officialResultExists);

            if (!officialResultExists) {
                when(raceEntryRepository.findAllById(List.of(
                        FIRST_RACE_ENTRY_ID,
                        SECOND_RACE_ENTRY_ID
                ))).thenReturn(raceEntries());
            }
        }

        if (includeDetailMappingStubs) {
            when(raceRepository.findById(RACE_ID))
                    .thenReturn(Optional.of(race(raceStatus)));
            when(entryRepository.findBySubmissionIdOrderByFinishPositionAsc(
                    SUBMISSION_ID
            )).thenReturn(submissionEntries());
            when(reviewActionRepository.findBySubmissionIdOrderByCreatedAtAsc(
                    SUBMISSION_ID
            )).thenReturn(List.of());
        }
    }

    private RaceResultSubmission submission(String status) {
        RaceResultSubmission submission = new RaceResultSubmission();
        submission.setSubmissionId(SUBMISSION_ID);
        submission.setRaceId(RACE_ID);
        submission.setStatus(status);
        submission.setSubmittedAt(LocalDateTime.now().minusMinutes(10));
        submission.setSubmittedBy(1);
        submission.setRefereeReviewedAt(LocalDateTime.now().minusMinutes(5));
        submission.setRefereeReviewedBy(7);
        return submission;
    }

    private List<RaceResultSubmissionEntry> submissionEntries() {
        return List.of(
                submissionEntry(1, FIRST_RACE_ENTRY_ID, 1, "00:00:55"),
                submissionEntry(2, SECOND_RACE_ENTRY_ID, 2, "00:00:59")
        );
    }

    private RaceResultSubmissionEntry submissionEntry(
            Integer position,
            Integer raceEntryId,
            Integer stall,
            String finishTime
    ) {
        RaceResultSubmissionEntry entry = new RaceResultSubmissionEntry();
        entry.setSubmissionEntryId(200 + position);
        entry.setSubmissionId(SUBMISSION_ID);
        entry.setRaceEntryId(raceEntryId);
        entry.setStartingStall(stall);
        entry.setFinishPosition(position);
        entry.setFinishTime(finishTime);
        entry.setPoints(0);
        return entry;
    }

    private List<RaceEntry> raceEntries() {
        RaceEntry first = new RaceEntry();
        first.setRaceEntryId(FIRST_RACE_ENTRY_ID);
        first.setRaceId(RACE_ID);
        first.setRegistrationId(300);
        first.setStartingStall(1);

        RaceEntry second = new RaceEntry();
        second.setRaceEntryId(SECOND_RACE_ENTRY_ID);
        second.setRaceId(RACE_ID);
        second.setRegistrationId(301);
        second.setStartingStall(2);

        return List.of(first, second);
    }

    private Race race() {
        return race(EventStatus.PENDING_REVIEW);
    }

    private Race race(String status) {
        Race race = new Race();
        race.setRaceId(RACE_ID);
        race.setTournamentId(10);
        race.setRaceName("Live Test");
        race.setTrackName("Main Track");
        race.setRaceStartTime(LocalDateTime.now().minusMinutes(20));
        race.setRaceEndTime(LocalDateTime.now().plusMinutes(30));
        race.setStatus(status);
        return race;
    }

    private User activeAdmin() {
        Role role = new Role();
        role.setRoleName("ADMIN");
        User admin = new User();
        admin.setUserID(ADMIN_ID);
        admin.setEmail("admin@example.com");
        admin.setUsername("admin.test");
        admin.setRole(role);
        admin.setStatus("ACTIVE");
        return admin;
    }

    private AdminRaceResultReviewRequest reviewRequest(String reason) {
        AdminRaceResultReviewRequest request =
                new AdminRaceResultReviewRequest();
        request.setReason(reason);
        return request;
    }
}
