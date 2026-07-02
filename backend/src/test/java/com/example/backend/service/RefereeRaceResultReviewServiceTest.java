package com.example.backend.service;

import com.example.backend.constant.RaceResultReviewActionType;
import com.example.backend.constant.RaceResultSubmissionStatus;
import com.example.backend.constant.RefereeAssignmentStatus;
import com.example.backend.dto.request.RefereeRaceResultReviewRequest;
import com.example.backend.dto.response.RaceResultSubmissionDetailResponse;
import com.example.backend.dto.response.RaceResultSubmissionSummaryResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceResultReviewAction;
import com.example.backend.entity.RaceResultSubmission;
import com.example.backend.entity.RaceResultSubmissionEntry;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultReviewActionRepository;
import com.example.backend.repository.RaceResultSubmissionEntryRepository;
import com.example.backend.repository.RaceResultSubmissionRepository;
import com.example.backend.repository.RefereeAssignmentRepository;
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
class RefereeRaceResultReviewServiceTest {

    private static final Integer REFEREE_ID = 7;
    private static final Integer RACE_ID = 20;
    private static final Integer SUBMISSION_ID = 50;

    @Mock
    private RaceResultSubmissionRepository submissionRepository;
    @Mock
    private RaceResultSubmissionEntryRepository entryRepository;
    @Mock
    private RaceResultReviewActionRepository reviewActionRepository;
    @Mock
    private RefereeAssignmentRepository assignmentRepository;
    @Mock
    private RaceRepository raceRepository;
    @Mock
    private UserRepository userRepository;

    private RefereeRaceResultReviewService service;

    @BeforeEach
    void setUp() {
        service = new RefereeRaceResultReviewService(
                submissionRepository,
                entryRepository,
                reviewActionRepository,
                assignmentRepository,
                raceRepository,
                userRepository
        );
    }

    @Test
    void getPendingSubmissionsReturnsAssignedSubmittedSubmissions() {
        when(userRepository.findByEmail("referee@example.com"))
                .thenReturn(Optional.of(activeReferee()));
        RaceResultSubmission submission = submittedSubmission();
        when(submissionRepository.findPendingForReferee(
                REFEREE_ID,
                RefereeAssignmentStatus.ASSIGNED,
                RaceResultSubmissionStatus.SUBMITTED
        )).thenReturn(List.of(submission));
        when(raceRepository.findById(RACE_ID)).thenReturn(Optional.of(race()));

        List<RaceResultSubmissionSummaryResponse> response =
                service.getPendingSubmissions("referee@example.com");

        assertEquals(1, response.size());
        assertEquals(SUBMISSION_ID, response.get(0).getSubmissionId());
        assertEquals("Live Test", response.get(0).getRaceName());
        assertEquals(RaceResultSubmissionStatus.SUBMITTED,
                response.get(0).getStatus());
    }

    @Test
    void getSubmissionDetailRejectsUnassignedReferee() {
        when(userRepository.findByEmail("referee@example.com"))
                .thenReturn(Optional.of(activeReferee()));
        when(submissionRepository.findById(SUBMISSION_ID))
                .thenReturn(Optional.of(submittedSubmission()));
        when(assignmentRepository.existsByRaceIdAndRefereeUserIdAndStatus(
                RACE_ID,
                REFEREE_ID,
                RefereeAssignmentStatus.ASSIGNED
        )).thenReturn(false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getSubmissionDetail(
                        SUBMISSION_ID,
                        "referee@example.com"
                )
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void confirmSubmissionUpdatesStatusAndWritesReviewAction() {
        stubReviewAccess(RaceResultSubmissionStatus.SUBMITTED, true);
        when(submissionRepository.save(any(RaceResultSubmission.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        RefereeRaceResultReviewRequest request = reviewRequest(" Looks good ");

        RaceResultSubmissionDetailResponse response =
                service.confirmSubmission(
                        SUBMISSION_ID,
                        request,
                        "referee@example.com"
                );

        ArgumentCaptor<RaceResultSubmission> submissionCaptor =
                ArgumentCaptor.forClass(RaceResultSubmission.class);
        verify(submissionRepository).save(submissionCaptor.capture());
        RaceResultSubmission savedSubmission = submissionCaptor.getValue();
        assertEquals(RaceResultSubmissionStatus.REFEREE_CONFIRMED,
                savedSubmission.getStatus());
        assertEquals(REFEREE_ID, savedSubmission.getRefereeReviewedBy());
        assertEquals("Looks good", savedSubmission.getRefereeComment());
        assertNotNull(savedSubmission.getRefereeReviewedAt());

        ArgumentCaptor<RaceResultReviewAction> actionCaptor =
                ArgumentCaptor.forClass(RaceResultReviewAction.class);
        verify(reviewActionRepository).save(actionCaptor.capture());
        RaceResultReviewAction action = actionCaptor.getValue();
        assertEquals(RaceResultReviewActionType.CONFIRM, action.getAction());
        assertEquals("REFEREE", action.getActorRole());
        assertEquals("Looks good", action.getComment());

        assertEquals(RaceResultSubmissionStatus.REFEREE_CONFIRMED,
                response.getStatus());
    }

    @Test
    void flagSubmissionRequiresReason() {
        stubReviewAccess(RaceResultSubmissionStatus.SUBMITTED, false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.flagSubmission(
                        SUBMISSION_ID,
                        reviewRequest(" "),
                        "referee@example.com"
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(submissionRepository, never()).save(any());
        verify(reviewActionRepository, never()).save(any());
    }

    @Test
    void flagSubmissionUpdatesStatusAndWritesReviewAction() {
        stubReviewAccess(RaceResultSubmissionStatus.SUBMITTED, true);
        when(submissionRepository.save(any(RaceResultSubmission.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RaceResultSubmissionDetailResponse response =
                service.flagSubmission(
                        SUBMISSION_ID,
                        reviewRequest("Wrong finish order"),
                        "referee@example.com"
                );

        ArgumentCaptor<RaceResultSubmission> submissionCaptor =
                ArgumentCaptor.forClass(RaceResultSubmission.class);
        verify(submissionRepository).save(submissionCaptor.capture());
        assertEquals(RaceResultSubmissionStatus.REFEREE_FLAGGED,
                submissionCaptor.getValue().getStatus());
        assertEquals("Wrong finish order",
                submissionCaptor.getValue().getRefereeComment());

        ArgumentCaptor<RaceResultReviewAction> actionCaptor =
                ArgumentCaptor.forClass(RaceResultReviewAction.class);
        verify(reviewActionRepository).save(actionCaptor.capture());
        assertEquals(RaceResultReviewActionType.FLAG,
                actionCaptor.getValue().getAction());

        assertEquals(RaceResultSubmissionStatus.REFEREE_FLAGGED,
                response.getStatus());
    }

    @Test
    void reviewRejectsNonSubmittedSubmission() {
        stubReviewAccess(RaceResultSubmissionStatus.REFEREE_CONFIRMED, false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.confirmSubmission(
                        SUBMISSION_ID,
                        reviewRequest(null),
                        "referee@example.com"
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(submissionRepository, never()).save(any());
        verify(reviewActionRepository, never()).save(any());
    }

    @Test
    void reviewRequiresActiveReferee() {
        User inactive = activeReferee();
        inactive.setStatus("INACTIVE");
        when(userRepository.findByEmail("referee@example.com"))
                .thenReturn(Optional.of(inactive));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getPendingSubmissions("referee@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(submissionRepository, never())
                .findPendingForReferee(any(), any(), any());
    }

    private void stubReviewAccess(
            String submissionStatus,
            boolean includeDetailMappingStubs
    ) {
        when(userRepository.findByEmail("referee@example.com"))
                .thenReturn(Optional.of(activeReferee()));
        when(submissionRepository.findByIdForUpdate(SUBMISSION_ID))
                .thenReturn(Optional.of(submission(submissionStatus)));
        when(assignmentRepository.existsByRaceIdAndRefereeUserIdAndStatus(
                RACE_ID,
                REFEREE_ID,
                RefereeAssignmentStatus.ASSIGNED
        )).thenReturn(true);
        if (includeDetailMappingStubs) {
            when(raceRepository.findById(RACE_ID))
                    .thenReturn(Optional.of(race()));
            when(entryRepository.findBySubmissionIdOrderByFinishPositionAsc(
                    SUBMISSION_ID
            )).thenReturn(List.of(submissionEntry()));
            when(reviewActionRepository.findBySubmissionIdOrderByCreatedAtAsc(
                    SUBMISSION_ID
            )).thenReturn(List.of());
        }
    }

    private RaceResultSubmission submittedSubmission() {
        return submission(RaceResultSubmissionStatus.SUBMITTED);
    }

    private RaceResultSubmission submission(String status) {
        RaceResultSubmission submission = new RaceResultSubmission();
        submission.setSubmissionId(SUBMISSION_ID);
        submission.setRaceId(RACE_ID);
        submission.setStatus(status);
        submission.setSubmittedAt(LocalDateTime.now().minusMinutes(5));
        submission.setSubmittedBy(1);
        return submission;
    }

    private RaceResultSubmissionEntry submissionEntry() {
        RaceResultSubmissionEntry entry = new RaceResultSubmissionEntry();
        entry.setSubmissionEntryId(100);
        entry.setSubmissionId(SUBMISSION_ID);
        entry.setRaceEntryId(200);
        entry.setStartingStall(1);
        entry.setFinishPosition(1);
        entry.setFinishTime("00:00:55");
        entry.setPoints(0);
        return entry;
    }

    private Race race() {
        Race race = new Race();
        race.setRaceId(RACE_ID);
        race.setTournamentId(10);
        race.setRaceName("Live Test");
        race.setTrackName("Main Track");
        race.setRaceStartTime(LocalDateTime.now().minusMinutes(20));
        race.setRaceEndTime(LocalDateTime.now().plusMinutes(30));
        return race;
    }

    private User activeReferee() {
        Role role = new Role();
        role.setRoleName("REFEREE");
        User referee = new User();
        referee.setUserID(REFEREE_ID);
        referee.setEmail("referee@example.com");
        referee.setUsername("referee.test");
        referee.setRole(role);
        referee.setStatus("ACTIVE");
        return referee;
    }

    private RefereeRaceResultReviewRequest reviewRequest(String reason) {
        RefereeRaceResultReviewRequest request =
                new RefereeRaceResultReviewRequest();
        request.setReason(reason);
        return request;
    }
}
