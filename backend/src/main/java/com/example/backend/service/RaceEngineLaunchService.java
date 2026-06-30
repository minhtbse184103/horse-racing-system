package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
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

    private static final long MIN_RUNNERS_TO_LAUNCH = 2;

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceResultRepository raceResultRepository;
    private final UserRepository userRepository;
    private final RaceEngineTokenService raceEngineTokenService;
    private final RaceEngineProcessLauncher raceEngineProcessLauncher;

    public RaceEngineLaunchService(
            RaceRepository raceRepository,
            RaceEntryRepository raceEntryRepository,
            RaceResultRepository raceResultRepository,
            UserRepository userRepository,
            RaceEngineTokenService raceEngineTokenService,
            RaceEngineProcessLauncher raceEngineProcessLauncher
    ) {
        this.raceRepository = raceRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceResultRepository = raceResultRepository;
        this.userRepository = userRepository;
        this.raceEngineTokenService = raceEngineTokenService;
        this.raceEngineProcessLauncher = raceEngineProcessLauncher;
    }

    @Transactional
    public RaceLaunchResponse launchRace(Integer raceId, String adminEmail) {
        User admin = getAdmin(adminEmail);

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        refreshRaceStatus(race);

        validateRaceCanBeLaunched(race);

        LocalDateTime now = LocalDateTime.now();
        String raceEngineToken = raceEngineTokenService.generateToken();
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
        race.setStatus(EventStatus.CANCELLED);
        race.setRaceEngineToken(null);
        race.setRaceEngineTokenIssuedAt(null);
        raceRepository.save(race);

        log.warn(
                "Launched raceId={} was marked failed/cancelled by adminId={}. Reason: {}",
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
        if (EventStatus.CANCELLED.equals(race.getStatus())
                || EventStatus.COMPLETED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race can no longer be run."
            );
        }

        if (!EventStatus.IN_PROGRESS.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race cannot be run before its scheduled start time."
            );
        }

        if (race.getRunStartedAt() != null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has already been launched."
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

    /**
     * Mirrors RaceService's private refreshRaceStatus: flips
     * OPEN_FOR_REGISTRATION/REGISTRATION_CLOSED to IN_PROGRESS once
     * raceStartTime has passed. Duplicated here (rather than calling
     * RaceService) because the Race row is already locked
     * (findByIdForUpdate) in this transaction and re-fetching through
     * another service would re-read it unlocked.
     */
    private void refreshRaceStatus(Race race) {
        if ((EventStatus.OPEN_FOR_REGISTRATION.equals(race.getStatus())
                || EventStatus.REGISTRATION_CLOSED.equals(race.getStatus()))
                && !LocalDateTime.now().isBefore(race.getRaceStartTime())) {
            race.setStatus(EventStatus.IN_PROGRESS);
            raceRepository.save(race);
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
