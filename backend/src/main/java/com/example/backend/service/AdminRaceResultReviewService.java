package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceResultReviewActionType;
import com.example.backend.constant.RaceResultSubmissionStatus;
import com.example.backend.dto.request.AdminRaceResultReviewRequest;
import com.example.backend.dto.response.RaceResultReviewActionResponse;
import com.example.backend.dto.response.RaceResultSubmissionDetailResponse;
import com.example.backend.dto.response.RaceResultSubmissionEntryResponse;
import com.example.backend.dto.response.RaceResultSubmissionSummaryResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RaceResult;
import com.example.backend.entity.RaceResultReviewAction;
import com.example.backend.entity.RaceResultSubmission;
import com.example.backend.entity.RaceResultSubmissionEntry;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RaceResultReviewActionRepository;
import com.example.backend.repository.RaceResultSubmissionEntryRepository;
import com.example.backend.repository.RaceResultSubmissionEntryRepository.RaceResultSubmissionEntryProjection;
import com.example.backend.repository.RaceResultSubmissionRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminRaceResultReviewService {

    private static final List<String> ADMIN_REVIEW_STATUSES = List.of(
            RaceResultSubmissionStatus.REFEREE_CONFIRMED,
            RaceResultSubmissionStatus.REFEREE_FLAGGED
    );

    private final RaceResultSubmissionRepository submissionRepository;
    private final RaceResultSubmissionEntryRepository entryRepository;
    private final RaceResultReviewActionRepository reviewActionRepository;
    private final RaceResultRepository raceResultRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceRepository raceRepository;
    private final UserRepository userRepository;
    private final RacePrizeSettlementService prizeSettlementService;
    private final PerformanceSummaryService performanceSummaryService;

    public AdminRaceResultReviewService(
            RaceResultSubmissionRepository submissionRepository,
            RaceResultSubmissionEntryRepository entryRepository,
            RaceResultReviewActionRepository reviewActionRepository,
            RaceResultRepository raceResultRepository,
            RaceEntryRepository raceEntryRepository,
            RaceRepository raceRepository,
            UserRepository userRepository,
            RacePrizeSettlementService prizeSettlementService,
            PerformanceSummaryService performanceSummaryService
    ) {
        this.submissionRepository = submissionRepository;
        this.entryRepository = entryRepository;
        this.reviewActionRepository = reviewActionRepository;
        this.raceResultRepository = raceResultRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceRepository = raceRepository;
        this.userRepository = userRepository;
        this.prizeSettlementService = prizeSettlementService;
        this.performanceSummaryService = performanceSummaryService;
    }

    @Transactional(readOnly = true)
    public List<RaceResultSubmissionSummaryResponse> getReviewQueue(
            String adminEmail
    ) {
        // FLOW: Admin Result Review Queue
        // ORDER: 4/6 - Service verifies ACTIVE ADMIN and requests only Referee-reviewed submissions.
        // Validation: ACTIVE ADMIN. Queue statuses: REFEREE_CONFIRMED and REFEREE_FLAGGED only.
        getAdmin(adminEmail);

        return submissionRepository.findAdminReviewQueue(ADMIN_REVIEW_STATUSES)
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RaceResultSubmissionDetailResponse getSubmissionDetail(
            Integer submissionId,
            String adminEmail
    ) {
        // FLOW: Admin Result Review Detail
        // ORDER: 4/8 - Service verifies ACTIVE ADMIN, loads submission, and delegates DTO assembly.
        // Validation: ACTIVE ADMIN before exposing provisional result detail for final decision.
        getAdmin(adminEmail);
        RaceResultSubmission submission = getSubmission(submissionId);
        return toDetailResponse(submission);
    }

    @Transactional
    public RaceResultSubmissionDetailResponse approveSubmission(
            Integer submissionId,
            AdminRaceResultReviewRequest request,
            String adminEmail
    ) {
        // FLOW: Admin Approve Result
        // ORDER: 4/9 - Service validates admin, referee-reviewed submission, approvable Race, and duplicate official results.
        // Validation: ACTIVE ADMIN, referee-reviewed submission, approvable Race, no duplicate official results.
        // DB effect: creates RaceResult rows, PrizeDistribution rows, performance summary updates, and review action.
        User admin = getAdmin(adminEmail);
        RaceResultSubmission submission = getSubmissionForReview(submissionId);
        Race race = getRaceForUpdate(submission.getRaceId());

        validateAdminReviewStatus(submission);
        validateRaceCanBeApproved(race);

        List<RaceResultSubmissionEntry> submissionEntries =
                entryRepository.findBySubmissionIdOrderByFinishPositionAsc(
                        submission.getSubmissionId()
                );
        if (submissionEntries.isEmpty()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race result submission has no result entries."
            );
        }

        List<Integer> raceEntryIds = submissionEntries.stream()
                .map(RaceResultSubmissionEntry::getRaceEntryId)
                .toList();
        if (raceResultRepository.existsByRaceEntryIdIn(raceEntryIds)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Official race result already exists for this race."
            );
        }

        Map<Integer, RaceEntry> entriesByRaceEntryId = raceEntryRepository
                .findAllById(raceEntryIds)
                .stream()
                .collect(Collectors.toMap(
                        RaceEntry::getRaceEntryId,
                        Function.identity()
                ));
        if (entriesByRaceEntryId.size() != raceEntryIds.size()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race result submission references an unknown race entry."
            );
        }

        LocalDateTime now = LocalDateTime.now();
        // FLOW: Admin Approve Result
        // ORDER: 5/9 - Convert provisional submission entries into official RaceResult rows.
        List<RaceResult> officialResults = submissionEntries.stream()
                .map(entry -> toOfficialResult(entry, admin.getUserID(), now))
                .toList();
        // FLOW: Admin Approve Result
        // ORDER: 6/9 - Persist official RaceResult rows; this is when results become business records.
        List<RaceResult> savedResults =
                raceResultRepository.saveAll(officialResults);

        // FLOW: Admin Approve Result
        // ORDER: 7/9 - Create pending PrizeDistribution rows from official results and prize rules.
        prizeSettlementService.settlePrizes(
                race.getRaceId(),
                savedResults,
                entriesByRaceEntryId
        );
        // FLOW: Admin Approve Result
        // ORDER: 8/9 - Update Horse/Jockey performance summaries after official approval.
        performanceSummaryService.updateAfterRaceApproved(
                savedResults,
                entriesByRaceEntryId
        );

        // FLOW: Admin Approve Result
        // ORDER: 9/9 - Mark Race COMPLETED, mark submission ADMIN_APPROVED, and write review action history.
        // Race lifecycle: official approval is the normal transition from PENDING_REVIEW to COMPLETED.
        race.setStatus(EventStatus.COMPLETED);
        raceRepository.save(race);

        submission.setStatus(RaceResultSubmissionStatus.ADMIN_APPROVED);
        submission.setAdminReviewedAt(now);
        submission.setAdminReviewedBy(admin.getUserID());
        submission.setAdminComment(trimmedReason(request));
        writeReviewAction(
                submission,
                admin,
                RaceResultReviewActionType.APPROVE,
                submission.getAdminComment(),
                now
        );

        RaceResultSubmission savedSubmission =
                submissionRepository.save(submission);
        return toDetailResponse(savedSubmission);
    }

    @Transactional
    public RaceResultSubmissionDetailResponse rejectSubmission(
            Integer submissionId,
            AdminRaceResultReviewRequest request,
            String adminEmail
    ) {
        // FLOW: Admin Reject Result
        // ORDER: 5/8 - Service validates ACTIVE ADMIN, referee-reviewed submission, and required reason.
        // Validation: ACTIVE ADMIN, referee-reviewed submission, required rejection reason.
        // DB effect: keeps rejected submission/review history, clears engine run fields, and returns Race to READY.
        User admin = getAdmin(adminEmail);
        RaceResultSubmission submission = getSubmissionForReview(submissionId);
        validateAdminReviewStatus(submission);

        String reason = trimmedReason(request);
        if (reason == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Admin rejection reason is required."
            );
        }

        Race race = getRaceForUpdate(submission.getRaceId());
        LocalDateTime now = LocalDateTime.now();
        // FLOW: Admin Reject Result
        // ORDER: 6/8 - Mark submission ADMIN_REJECTED and preserve Admin reason in review history.
        submission.setStatus(RaceResultSubmissionStatus.ADMIN_REJECTED);
        submission.setAdminReviewedAt(now);
        submission.setAdminReviewedBy(admin.getUserID());
        submission.setAdminComment(reason);
        writeReviewAction(
                submission,
                admin,
                RaceResultReviewActionType.REJECT,
                reason,
                now
        );

        // FLOW: Admin Reject Result
        // ORDER: 7/8 - Reset Race to READY and clear stale Unity run/token fields for a new launch.
        // READY after Admin rejection is a manual recovery state. It is not
        // controlled by raceStartTime; Admin must launch Unity again to
        // generate a new engine token and a new provisional submission.
        race.setStatus(EventStatus.READY);
        race.setRunStartedAt(null);
        race.setRunTriggeredBy(null);
        race.setRaceEngineToken(null);
        race.setRaceEngineTokenIssuedAt(null);
        raceRepository.save(race);

        RaceResultSubmission savedSubmission =
                submissionRepository.save(submission);
        return toDetailResponse(savedSubmission);
    }

    private RaceResult toOfficialResult(
            RaceResultSubmissionEntry entry,
            Integer adminId,
            LocalDateTime recordedAt
    ) {
        // FLOW: Admin Approve Result
        // ORDER: 5A/9 - Mapper copies provisional finish position/time into a new official RaceResult entity.
        RaceResult result = new RaceResult();
        result.setRaceEntryId(entry.getRaceEntryId());
        result.setFinishPosition(entry.getFinishPosition());
        result.setFinishTime(entry.getFinishTime());
        result.setRecordedBy(adminId);
        result.setRecordedAt(recordedAt);
        return result;
    }

    private void writeReviewAction(
            RaceResultSubmission submission,
            User admin,
            String action,
            String comment,
            LocalDateTime now
    ) {
        RaceResultReviewAction reviewAction = new RaceResultReviewAction();
        reviewAction.setSubmissionId(submission.getSubmissionId());
        reviewAction.setActorUserId(admin.getUserID());
        reviewAction.setActorRole("ADMIN");
        reviewAction.setAction(action);
        reviewAction.setComment(comment);
        reviewAction.setCreatedAt(now);
        reviewActionRepository.save(reviewAction);
    }

    private void validateAdminReviewStatus(
            RaceResultSubmission submission
    ) {
        // FLOW: Admin Approve Result
        // ORDER: 4A/9 - Shared approval guard allows only REFEREE_CONFIRMED or REFEREE_FLAGGED submissions.
        // Validation shared by approve/reject: only REFEREE_CONFIRMED or REFEREE_FLAGGED can be decided by Admin.
        if (!ADMIN_REVIEW_STATUSES.contains(submission.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only referee-reviewed race results can be reviewed by admin."
            );
        }
    }

    private void validateRaceCanBeApproved(Race race) {
        // FLOW: Admin Approve Result
        // ORDER: 4B/9 - Race guard allows approval only while the Race is PENDING_REVIEW.
        // Validation: approval is allowed only while Race is PENDING_REVIEW and not already cancelled/completed.
        if (EventStatus.CANCELLED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Cancelled race result cannot be approved."
            );
        }
        if (EventStatus.COMPLETED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has already been completed."
            );
        }
        if (!EventStatus.PENDING_REVIEW.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race must be pending result review before approval."
            );
        }
    }

    private User getAdmin(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated admin does not exist."
                ));

        if (admin.getRole() == null
                || !"ADMIN".equalsIgnoreCase(admin.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only admins can review race results."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(admin.getStatus())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Admin account is not active."
            );
        }

        return admin;
    }

    private RaceResultSubmission getSubmission(Integer submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race result submission does not exist."
                ));
    }

    private RaceResultSubmission getSubmissionForReview(Integer submissionId) {
        return submissionRepository.findByIdForUpdate(submissionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race result submission does not exist."
                ));
    }

    private Race getRace(Integer raceId) {
        return raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));
    }

    private Race getRaceForUpdate(Integer raceId) {
        return raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));
    }

    private String trimmedReason(AdminRaceResultReviewRequest request) {
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
                .horseCount(entryRepository.countBySubmissionId(
                        submission.getSubmissionId()
                ))
                .build();
    }

    private RaceResultSubmissionDetailResponse toDetailResponse(
            RaceResultSubmission submission
    ) {
        // FLOW: Admin Result Review Detail
        // ORDER: 5/8 - Service assembles Race metadata, enriched finish entries, and review history.
        // DB read: Race metadata, enriched finish entries, and Referee/Admin review history.
        Race race = getRace(submission.getRaceId());
        List<RaceResultSubmissionEntryResponse> entries = entryRepository
                .findEntryDetailsBySubmissionId(submission.getSubmissionId())
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
            RaceResultSubmissionEntryProjection entry
    ) {
        return RaceResultSubmissionEntryResponse.builder()
                .submissionEntryId(entry.getSubmissionEntryId())
                .raceEntryId(entry.getRaceEntryId())
                .startingStall(entry.getStartingStall())
                .finishPosition(entry.getFinishPosition())
                .horseName(entry.getHorseName())
                .ownerName(entry.getOwnerName())
                .jockeyName(entry.getJockeyName())
                .finishTime(entry.getFinishTime())
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
}
