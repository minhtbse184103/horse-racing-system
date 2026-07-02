package com.example.backend.service;

import com.example.backend.constant.RaceResultReviewActionType;
import com.example.backend.constant.RaceResultSubmissionStatus;
import com.example.backend.constant.RefereeAssignmentStatus;
import com.example.backend.dto.request.RefereeRaceResultReviewRequest;
import com.example.backend.dto.response.RaceResultReviewActionResponse;
import com.example.backend.dto.response.RaceResultSubmissionDetailResponse;
import com.example.backend.dto.response.RaceResultSubmissionEntryResponse;
import com.example.backend.dto.response.RaceResultSubmissionSummaryResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceResultReviewAction;
import com.example.backend.entity.RaceResultSubmission;
import com.example.backend.entity.RaceResultSubmissionEntry;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultReviewActionRepository;
import com.example.backend.repository.RaceResultSubmissionEntryRepository;
import com.example.backend.repository.RaceResultSubmissionRepository;
import com.example.backend.repository.RefereeAssignmentRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RefereeRaceResultReviewService {

    private final RaceResultSubmissionRepository submissionRepository;
    private final RaceResultSubmissionEntryRepository entryRepository;
    private final RaceResultReviewActionRepository reviewActionRepository;
    private final RefereeAssignmentRepository assignmentRepository;
    private final RaceRepository raceRepository;
    private final UserRepository userRepository;

    public RefereeRaceResultReviewService(
            RaceResultSubmissionRepository submissionRepository,
            RaceResultSubmissionEntryRepository entryRepository,
            RaceResultReviewActionRepository reviewActionRepository,
            RefereeAssignmentRepository assignmentRepository,
            RaceRepository raceRepository,
            UserRepository userRepository
    ) {
        this.submissionRepository = submissionRepository;
        this.entryRepository = entryRepository;
        this.reviewActionRepository = reviewActionRepository;
        this.assignmentRepository = assignmentRepository;
        this.raceRepository = raceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RaceResultSubmissionSummaryResponse> getPendingSubmissions(
            String refereeEmail
    ) {
        User referee = getReferee(refereeEmail);

        return submissionRepository
                .findPendingForReferee(
                        referee.getUserID(),
                        RefereeAssignmentStatus.ASSIGNED,
                        RaceResultSubmissionStatus.SUBMITTED
                )
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RaceResultSubmissionDetailResponse getSubmissionDetail(
            Integer submissionId,
            String refereeEmail
    ) {
        User referee = getReferee(refereeEmail);
        RaceResultSubmission submission = getSubmission(submissionId);
        validateAssignedReferee(submission.getRaceId(), referee.getUserID());
        return toDetailResponse(submission);
    }

    @Transactional
    public RaceResultSubmissionDetailResponse confirmSubmission(
            Integer submissionId,
            RefereeRaceResultReviewRequest request,
            String refereeEmail
    ) {
        return reviewSubmission(
                submissionId,
                request,
                refereeEmail,
                RaceResultSubmissionStatus.REFEREE_CONFIRMED,
                RaceResultReviewActionType.CONFIRM,
                false
        );
    }

    @Transactional
    public RaceResultSubmissionDetailResponse flagSubmission(
            Integer submissionId,
            RefereeRaceResultReviewRequest request,
            String refereeEmail
    ) {
        return reviewSubmission(
                submissionId,
                request,
                refereeEmail,
                RaceResultSubmissionStatus.REFEREE_FLAGGED,
                RaceResultReviewActionType.FLAG,
                true
        );
    }

    private RaceResultSubmissionDetailResponse reviewSubmission(
            Integer submissionId,
            RefereeRaceResultReviewRequest request,
            String refereeEmail,
            String nextStatus,
            String action,
            boolean reasonRequired
    ) {
        User referee = getReferee(refereeEmail);
        RaceResultSubmission submission = submissionRepository
                .findByIdForUpdate(submissionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race result submission does not exist."
                ));

        validateAssignedReferee(submission.getRaceId(), referee.getUserID());
        validateSubmitted(submission);

        String comment = trimmedReason(request);
        if (reasonRequired && comment == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Flag reason is required."
            );
        }

        LocalDateTime now = LocalDateTime.now();
        submission.setStatus(nextStatus);
        submission.setRefereeReviewedAt(now);
        submission.setRefereeReviewedBy(referee.getUserID());
        submission.setRefereeComment(comment);

        RaceResultReviewAction reviewAction = new RaceResultReviewAction();
        reviewAction.setSubmissionId(submission.getSubmissionId());
        reviewAction.setActorUserId(referee.getUserID());
        reviewAction.setActorRole("REFEREE");
        reviewAction.setAction(action);
        reviewAction.setComment(comment);
        reviewAction.setCreatedAt(now);
        reviewActionRepository.save(reviewAction);

        RaceResultSubmission saved = submissionRepository.save(submission);
        return toDetailResponse(saved);
    }

    private User getReferee(String refereeEmail) {
        User referee = userRepository.findByEmail(refereeEmail)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated referee does not exist."
                ));

        if (referee.getRole() == null
                || !"REFEREE".equalsIgnoreCase(referee.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only referees can review race results."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(referee.getStatus())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Referee account is not active."
            );
        }

        return referee;
    }

    private RaceResultSubmission getSubmission(Integer submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race result submission does not exist."
                ));
    }

    private void validateAssignedReferee(Integer raceId, Integer refereeUserId) {
        boolean assigned =
                assignmentRepository.existsByRaceIdAndRefereeUserIdAndStatus(
                        raceId,
                        refereeUserId,
                        RefereeAssignmentStatus.ASSIGNED
                );

        if (!assigned) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Referee is not assigned to this race."
            );
        }
    }

    private void validateSubmitted(RaceResultSubmission submission) {
        if (!RaceResultSubmissionStatus.SUBMITTED.equals(submission.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only submitted race results can be reviewed by referee."
            );
        }
    }

    private String trimmedReason(RefereeRaceResultReviewRequest request) {
        if (request == null || request.getReason() == null) {
            return null;
        }

        String trimmed = request.getReason().trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private RaceResultSubmissionSummaryResponse toSummaryResponse(
            RaceResultSubmission submission
    ) {
        Race race = getRace(submission.getRaceId());

        return RaceResultSubmissionSummaryResponse.builder()
                .submissionId(submission.getSubmissionId())
                .raceId(race.getRaceId())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .raceStartTime(race.getRaceStartTime())
                .raceEndTime(race.getRaceEndTime())
                .tournamentId(race.getTournamentId())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }

    private RaceResultSubmissionDetailResponse toDetailResponse(
            RaceResultSubmission submission
    ) {
        Race race = getRace(submission.getRaceId());
        List<RaceResultSubmissionEntryResponse> entries = entryRepository
                .findBySubmissionIdOrderByFinishPositionAsc(
                        submission.getSubmissionId()
                )
                .stream()
                .map(this::toEntryResponse)
                .toList();
        List<RaceResultReviewActionResponse> reviewActions =
                reviewActionRepository
                        .findBySubmissionIdOrderByCreatedAtAsc(
                                submission.getSubmissionId()
                        )
                        .stream()
                        .map(this::toReviewActionResponse)
                        .toList();

        return RaceResultSubmissionDetailResponse.builder()
                .submissionId(submission.getSubmissionId())
                .raceId(race.getRaceId())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .raceStartTime(race.getRaceStartTime())
                .raceEndTime(race.getRaceEndTime())
                .tournamentId(race.getTournamentId())
                .status(submission.getStatus())
                .submittedAt(submission.getSubmittedAt())
                .submittedBy(submission.getSubmittedBy())
                .refereeReviewedAt(submission.getRefereeReviewedAt())
                .refereeReviewedBy(submission.getRefereeReviewedBy())
                .refereeComment(submission.getRefereeComment())
                .adminReviewedAt(submission.getAdminReviewedAt())
                .adminReviewedBy(submission.getAdminReviewedBy())
                .adminComment(submission.getAdminComment())
                .entries(entries)
                .reviewActions(reviewActions)
                .build();
    }

    private RaceResultSubmissionEntryResponse toEntryResponse(
            RaceResultSubmissionEntry entry
    ) {
        return RaceResultSubmissionEntryResponse.builder()
                .submissionEntryId(entry.getSubmissionEntryId())
                .raceEntryId(entry.getRaceEntryId())
                .startingStall(entry.getStartingStall())
                .finishPosition(entry.getFinishPosition())
                .finishTime(entry.getFinishTime())
                .points(entry.getPoints())
                .build();
    }

    private RaceResultReviewActionResponse toReviewActionResponse(
            RaceResultReviewAction action
    ) {
        return RaceResultReviewActionResponse.builder()
                .reviewActionId(action.getReviewActionId())
                .actorUserId(action.getActorUserId())
                .actorRole(action.getActorRole())
                .action(action.getAction())
                .comment(action.getComment())
                .createdAt(action.getCreatedAt())
                .build();
    }

    private Race getRace(Integer raceId) {
        return raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));
    }
}
