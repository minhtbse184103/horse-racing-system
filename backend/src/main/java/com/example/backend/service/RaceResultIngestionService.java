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
 * Ingests the final result Unity posts when a race finishes (via the
 * per-launch X-Race-Engine-Key token, not JWT). Writes RaceResult
 * rows and flips the Race straight to COMPLETED.
 *
 * Deliberately NOT RaceService.completeRace(): that method gates on
 * raceEndTime having passed, but here completion is event-driven
 * (Unity reporting it actually finished). Betting/prize-payout
 * settlement (Bet, PrizeDistribution, WalletTransaction) is out of
 * scope — writing RaceResult rows and completing the race is enough.
 */
@Service
public class RaceResultIngestionService {

    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceResultRepository raceResultRepository;
    private final RaceEngineTokenService raceEngineTokenService;

    public RaceResultIngestionService(
            RaceRepository raceRepository,
            RaceEntryRepository raceEntryRepository,
            RaceResultRepository raceResultRepository,
            RaceEngineTokenService raceEngineTokenService
    ) {
        this.raceRepository = raceRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceResultRepository = raceResultRepository;
        this.raceEngineTokenService = raceEngineTokenService;
    }

    @Transactional
    public RaceResultIngestResponse ingestResult(
            Integer raceId,
            String raceEngineToken,
            RaceResultIngestRequest request
    ) {
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
                    "Results have already been recorded for this race."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        // runStartedAt is non-null here (checked above), and the
        // launcher always sets runTriggeredBy in the same write, so
        // this is guaranteed non-null too — required by the NOT NULL
        // recordedBy column.
        Integer recordedBy = race.getRunTriggeredBy();

        List<RaceResult> results = submitted.stream()
                .map(entryRequest -> {
                    RaceEntry entry =
                            entriesByStall.get(entryRequest.getStartingStall());

                    RaceResult result = new RaceResult();
                    result.setRaceEntryId(entry.getRaceEntryId());
                    result.setFinishPosition(entryRequest.getFinishPosition());
                    result.setFinishTime(entryRequest.getFinishTime());
                    result.setRecordedAt(now);
                    result.setRecordedBy(recordedBy);
                    return result;
                })
                .toList();

        raceResultRepository.saveAll(results);

        race.setStatus(EventStatus.COMPLETED);
        race.setRaceEngineToken(null);
        race.setRaceEngineTokenIssuedAt(null);
        raceRepository.save(race);

        return RaceResultIngestResponse.builder()
                .raceId(race.getRaceId())
                .status(race.getStatus())
                .recordedAt(now)
                .build();
    }

    private void validateRaceCanReceiveResult(Race race) {
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
        if (race.getRunStartedAt() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has not been launched yet."
            );
        }
    }
}
