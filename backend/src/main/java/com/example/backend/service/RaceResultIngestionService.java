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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Ingests the provisional result Unity posts when a race finishes
 * (via the per-launch X-Race-Engine-Key token, not JWT). Writes
 * RaceResultSubmission rows and moves the Race to PENDING_REVIEW.
 *
 * Deliberately NOT RaceService.completeRace(): that method gates on
 * raceEndTime having passed, but here completion is event-driven
 * (Unity reporting it actually finished). Official RaceResult rows
 * and PrizeDistribution rows are created only after Referee/Admin
 * review in a later workflow.
 */
@Service
public class RaceResultIngestionService {

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceResultRepository raceResultRepository;
    private final RaceEngineTokenService raceEngineTokenService;
    private final RaceResultSubmissionRepository submissionRepository;
    private final RaceResultSubmissionEntryRepository submissionEntryRepository;

    public RaceResultIngestionService(
            RaceRepository raceRepository,
            RaceEntryRepository raceEntryRepository,
            RaceResultRepository raceResultRepository,
            RaceEngineTokenService raceEngineTokenService,
            RaceResultSubmissionRepository submissionRepository,
            RaceResultSubmissionEntryRepository submissionEntryRepository
    ) {
        this.raceRepository = raceRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceResultRepository = raceResultRepository;
        this.raceEngineTokenService = raceEngineTokenService;
        this.submissionRepository = submissionRepository;
        this.submissionEntryRepository = submissionEntryRepository;
    }

    @Transactional
    public RaceResultIngestResponse ingestResult(
            Integer raceId,
            String raceEngineToken,
            RaceResultIngestRequest request
    ) {
        // FLOW: Unity Result Endpoint
        // ORDER: 3/10 - Service locks Race row and validates the X-Race-Engine-Key belongs to this launched session.
        // Validation: Race row is locked, X-Race-Engine-Key matches the launch
        // token, Race is IN_PROGRESS, and submitted entries match assigned stalls.
        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));
        raceEngineTokenService.validateToken(race, raceEngineToken);

        validateRaceCanReceiveResult(race);

        List<RaceEntry> assignedEntries = raceEntryRepository
                .findByRaceIdAndStatusOrderByStartingStallAsc(
                        raceId,
                        RaceEntryStatus.ASSIGNED
                );

        if (assignedEntries.isEmpty()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has no assigned entries to record results for."
            );
        }

        Map<Integer, RaceEntry> entriesByStall = assignedEntries.stream()
                .collect(Collectors.toMap(
                        RaceEntry::getStartingStall,
                        Function.identity()
                ));

        // FLOW: Unity Result Endpoint
        // ORDER: 5/10 - Build assigned-entry lookup so Unity result rows must match backend-owned starting stalls.
        List<RaceResultEntryRequest> submitted = request.getEntries();

        if (submitted.size() != assignedEntries.size()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Result entry count (" + submitted.size()
                            + ") does not match the number of assigned"
                            + " entries (" + assignedEntries.size() + ")."
            );
        }

        Set<Integer> seenStalls = new HashSet<>();
        Set<Integer> seenPositions = new HashSet<>();

        // FLOW: Unity Result Endpoint
        // ORDER: 6/10 - Validate every submitted stall/finish position is unique, assigned, and contiguous.
        for (RaceResultEntryRequest entryRequest : submitted) {
            Integer stall = entryRequest.getStartingStall();
            Integer finishPosition = entryRequest.getFinishPosition();

            if (!entriesByStall.containsKey(stall)) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Starting stall " + stall
                                + " is not an assigned entry for this race."
                );
            }
            if (!seenStalls.add(stall)) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Duplicate starting stall " + stall + " in result."
                );
            }
            if (finishPosition == null || finishPosition < 1) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Finish position must be at least 1."
                );
            }
            if (!seenPositions.add(finishPosition)) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Duplicate finish position " + finishPosition
                                + " in result."
                );
            }
        }

        for (int expectedPosition = 1;
             expectedPosition <= assignedEntries.size();
             expectedPosition++) {
            if (!seenPositions.contains(expectedPosition)) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Finish positions must be contiguous from 1 to "
                                + assignedEntries.size() + "."
                );
            }
        }

        List<Integer> raceEntryIds = assignedEntries.stream()
                .map(RaceEntry::getRaceEntryId)
                .toList();

        if (raceResultRepository.existsByRaceEntryIdIn(raceEntryIds)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Official race result already exists for this race."
            );
        }

        // FLOW: Provisional Race Result Submission
        // ORDER: 7/10 - Duplicate guard ensures one active provisional submission per Race review cycle.
        // Unity is allowed to create only one active submission per Race. It
        // does not create official RaceResult/PrizeDistribution rows here.
        if (submissionRepository.existsByRaceIdAndStatusIn(
                raceId,
                RaceResultSubmissionStatus.ACTIVE_SUBMISSION_STATUSES
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race already has a result submission under review."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        // FLOW: Provisional Race Result Submission
        // ORDER: 8/10 - Create provisional submission header in SUBMITTED state for Referee/Admin review.
        // DB effect: create submission header with SUBMITTED review status;
        // Referee/Admin review later decides whether this becomes official.
        RaceResultSubmission submission = new RaceResultSubmission();
        submission.setRaceId(raceId);
        submission.setSubmittedAt(now);
        submission.setSubmittedBy(race.getRunTriggeredBy());
        submission.setEngineTokenIssuedAt(race.getRaceEngineTokenIssuedAt());
        submission.setStatus(RaceResultSubmissionStatus.SUBMITTED);
        RaceResultSubmission savedSubmission =
                submissionRepository.save(submission);

        // FLOW: Provisional Race Result Submission
        // ORDER: 9/10 - Persist Unity finish rows as provisional submission entries, not official RaceResult rows.
        // DB effect: copy each Unity result row into submission entries tied
        // to existing RaceEntry IDs, preserving stalls/finish order for review.
        List<RaceResultSubmissionEntry> submissionEntries = submitted.stream()
                .map(entryRequest -> toSubmissionEntry(
                        savedSubmission.getSubmissionId(),
                        entriesByStall.get(entryRequest.getStartingStall()),
                        entryRequest
                ))
                .toList();
        submissionEntryRepository.saveAll(submissionEntries);

        // FLOW: Race Status After Unity Finish
        // ORDER: 10/10 - After provisional rows exist, move Race to PENDING_REVIEW and clear single-use engine token.
        // DB effect: Unity finish does not complete the Race. It moves
        // IN_PROGRESS -> PENDING_REVIEW and clears the single-use engine token.
        race.setStatus(EventStatus.PENDING_REVIEW);
        race.setRaceEngineToken(null);
        race.setRaceEngineTokenIssuedAt(null);
        raceRepository.save(race);

        return RaceResultIngestResponse.builder()
                .raceId(race.getRaceId())
                .submissionId(savedSubmission.getSubmissionId())
                .status(race.getStatus())
                .reviewStatus(savedSubmission.getStatus())
                .recordedAt(now)
                .build();
    }

    private RaceResultSubmissionEntry toSubmissionEntry(
            Integer submissionId,
            RaceEntry entry,
            RaceResultEntryRequest entryRequest
    ) {
        // FLOW: Provisional Race Result Submission
        // ORDER: 9A/10 - Map one validated Unity result row to the provisional entry entity.
        // Maps one Unity result row to a reviewable entry. This is not an
        // official RaceResult row until Admin approves the submission.
        RaceResultSubmissionEntry submissionEntry =
                new RaceResultSubmissionEntry();
        submissionEntry.setSubmissionId(submissionId);
        submissionEntry.setRaceEntryId(entry.getRaceEntryId());
        submissionEntry.setStartingStall(entryRequest.getStartingStall());
        submissionEntry.setFinishPosition(entryRequest.getFinishPosition());
        submissionEntry.setFinishTime(entryRequest.getFinishTime());
        return submissionEntry;
    }

    private void validateRaceCanReceiveResult(Race race) {
        // FLOW: Unity Result Endpoint
        // ORDER: 4/10 - Race must still be launched and IN_PROGRESS before Unity result can be accepted.
        // Only an actively launched Race can accept Unity's final payload;
        // READY/PENDING_REVIEW/COMPLETED/CANCELLED states are rejected here.
        if (EventStatus.COMPLETED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has already been completed."
            );
        }
        if (EventStatus.CANCELLED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has been cancelled."
            );
        }
        if (!EventStatus.IN_PROGRESS.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race must be in progress before results can be recorded."
            );
        }
        if (race.getRunStartedAt() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has not been launched yet."
            );
        }
    }
}
