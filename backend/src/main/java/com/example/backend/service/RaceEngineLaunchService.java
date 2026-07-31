package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RaceResultSubmissionStatus;
import com.example.backend.dto.request.FailRaceRunRequest;
import com.example.backend.dto.response.RaceLaunchResponse;
import com.example.backend.dto.response.RaceRunRecoveryResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RaceResultSubmissionRepository;
import com.example.backend.repository.RefereeAssignmentRepository;
import com.example.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Launches the Unity race engine for a single Race. This is the
 * "Run Race" action: gated on the race's scheduled raceStartTime
 * having already passed, and on every entry slot already being
 * assigned. The backend owns the launch token and starts one Unity
 * executable process for the race; frontend only watches backend live data.
 */
@Slf4j
@Service
public class RaceEngineLaunchService {

    private static final long MIN_RUNNERS_TO_LAUNCH = 3;

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceResultRepository raceResultRepository;
    private final RaceResultSubmissionRepository raceResultSubmissionRepository;
    private final RefereeAssignmentRepository refereeAssignmentRepository;
    private final UserRepository userRepository;
    private final RaceEngineTokenService raceEngineTokenService;
    private final RaceEngineProcessLauncher raceEngineProcessLauncher;

    public RaceEngineLaunchService(
            RaceRepository raceRepository,
            RaceEntryRepository raceEntryRepository,
            RaceResultRepository raceResultRepository,
            RaceResultSubmissionRepository raceResultSubmissionRepository,
            RefereeAssignmentRepository refereeAssignmentRepository,
            UserRepository userRepository,
            RaceEngineTokenService raceEngineTokenService,
            RaceEngineProcessLauncher raceEngineProcessLauncher
    ) {
        this.raceRepository = raceRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceResultRepository = raceResultRepository;
        this.raceResultSubmissionRepository = raceResultSubmissionRepository;
        this.refereeAssignmentRepository = refereeAssignmentRepository;
        this.userRepository = userRepository;
        this.raceEngineTokenService = raceEngineTokenService;
        this.raceEngineProcessLauncher = raceEngineProcessLauncher;
    }

    @Transactional
    public RaceLaunchResponse launchRace(Integer raceId, String adminEmail) {
        // FLOW: Admin Launch Unity Race
        // ORDER: 5/9 - Service locks Race, validates launch prerequisites, generates token, and stores IN_PROGRESS state.
        // Validation: Admin must be ACTIVE ADMIN; Race must be READY; no active result submission; Referee assigned; at least MIN_RUNNERS_TO_LAUNCH assigned entries.
        // DB effect: sets Race IN_PROGRESS, writes runStartedAt/runTriggeredBy, stores one per-launch engine token, then starts Unity after commit.
        User admin = getAdmin(adminEmail);

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        validateRaceCanBeLaunched(race);

        LocalDateTime now = LocalDateTime.now();
        String raceEngineToken = raceEngineTokenService.generateToken();
        // FLOW: Admin Launch Unity Race
        // ORDER: 7/9 - Race stores IN_PROGRESS state, admin trigger audit, run timestamp, and per-launch engine token before Unity starts.
        race.setStatus(EventStatus.IN_PROGRESS);
        race.setRunTriggeredBy(admin.getUserID());
        race.setRunStartedAt(now);
        race.setRaceEngineToken(raceEngineToken);
        race.setRaceEngineTokenIssuedAt(now);
        raceRepository.saveAndFlush(race);

        launchAfterCommit(race.getRaceId(), raceEngineToken);

        return RaceLaunchResponse.builder()
                .raceId(race.getRaceId())
                .status(race.getStatus())
                .launchedAt(now)
                .raceEngineToken(raceEngineToken)
                .build();
    }

    private void launchAfterCommit(Integer raceId, String raceEngineToken) {
        // FLOW: Admin Launch Unity Race
        // ORDER: 8/9 - After-commit hook starts Unity only after Race IN_PROGRESS/token fields are safely committed.
        // Purpose: starts the Unity executable only after the Race IN_PROGRESS/token update commits successfully.
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            raceEngineProcessLauncher.launch(raceId, raceEngineToken);
            log.info("raceId={} marked as launched and Unity executable process requested.", raceId);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                raceEngineProcessLauncher.launch(raceId, raceEngineToken);
                log.info("raceId={} marked as launched and Unity executable process requested.", raceId);
            }
        });
    }

    @Transactional
    public RaceRunRecoveryResponse failLaunchedRace(
            Integer raceId,
            FailRaceRunRequest request,
            String adminEmail
    ) {
        // FLOW: Admin Fail Running Race
        // ORDER: 6/7 - Service validates admin/reason, locks Race, clears the failed Unity run, and returns Race to READY.
        // Validation: ACTIVE ADMIN, nonblank reason, Race is locked, launched,
        // IN_PROGRESS, and has no recorded official RaceResult rows.
        // DB effect: Race becomes READY for rerun and Unity run/token fields are cleared.
        User admin = getAdmin(adminEmail);
        String reason = request == null ? null : request.getReason();

        if (reason == null || reason.trim().isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Failure reason is required."
            );
        }

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        validateRaceRunCanBeFailed(race);

        String trimmedReason = reason.trim();
        LocalDateTime now = LocalDateTime.now();
        race.setStatus(EventStatus.READY);
        race.setRunStartedAt(null);
        race.setRunTriggeredBy(null);
        race.setRaceEngineToken(null);
        race.setRaceEngineTokenIssuedAt(null);
        raceRepository.save(race);

        log.warn(
                "Launched raceId={} was marked failed and returned to READY by adminId={}. Reason: {}",
                race.getRaceId(),
                admin.getUserID(),
                trimmedReason
        );

        return RaceRunRecoveryResponse.builder()
                .raceId(race.getRaceId())
                .status(race.getStatus())
                .recoveredAt(now)
                .reason(trimmedReason)
                .build();
    }

    private void validateRaceRunCanBeFailed(Race race) {
        // FLOW: Admin Fail Running Race
        // ORDER: 7/7 - Guard blocks failure after completion/cancellation or after official RaceResult data exists.
        // Protects result integrity: only a launched IN_PROGRESS Race can be
        // failed, and not after official RaceResult data already exists.
        if (race.getRunStartedAt() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has not been launched yet."
            );
        }

        if (EventStatus.COMPLETED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Completed race cannot be marked failed."
            );
        }

        if (EventStatus.CANCELLED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has already been cancelled."
            );
        }

        if (!EventStatus.IN_PROGRESS.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only an in-progress launched race can be marked failed."
            );
        }

        List<Integer> raceEntryIds = raceEntryRepository
                .findByRaceIdAndStatusOrderByStartingStallAsc(
                        race.getRaceId(),
                        RaceEntryStatus.ASSIGNED
                )
                .stream()
                .map(RaceEntry::getRaceEntryId)
                .toList();

        if (!raceEntryIds.isEmpty()
                && raceResultRepository.existsByRaceEntryIdIn(raceEntryIds)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race result has already been recorded."
            );
        }
    }

    private void validateRaceCanBeLaunched(Race race) {
        // FLOW: Admin Launch Unity Race
        // ORDER: 5A/9 - Validation allows launch only for READY Race with Referee, no active submission, and enough ASSIGNED entries.
        // Validation: launch is allowed only for READY Race with Referee assignment, no active review submission, and enough ASSIGNED RaceEntries.
        if (EventStatus.CANCELLED.equals(race.getStatus())
                || EventStatus.COMPLETED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race can no longer be run."
            );
        }

        if (!EventStatus.READY.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race cannot be run before it is ready."
            );
        }

        if (race.getRunStartedAt() != null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has already been launched."
            );
        }

        if (raceResultSubmissionRepository.existsByRaceIdAndStatusIn(
                race.getRaceId(),
                RaceResultSubmissionStatus.ACTIVE_SUBMISSION_STATUSES
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race already has a result submission under review."
            );
        }

        if (!refereeAssignmentRepository.existsByRaceId(race.getRaceId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Please assign a referee before launching this race."
            );
        }

        long assignedEntries = raceEntryRepository.countByRaceIdAndStatus(
                race.getRaceId(),
                RaceEntryStatus.ASSIGNED
        );

        if (assignedEntries < MIN_RUNNERS_TO_LAUNCH) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race needs at least " + MIN_RUNNERS_TO_LAUNCH
                            + " assigned entries before it can be run."
            );
        }
    }

    private User getAdmin(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated administrator does not exist."
                ));

        if (admin.getRole() == null
                || !"ADMIN".equalsIgnoreCase(admin.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can run races."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(admin.getStatus())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Administrator account is not active."
            );
        }

        return admin;
    }
}
