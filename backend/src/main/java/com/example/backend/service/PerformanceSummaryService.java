package com.example.backend.service;

import com.example.backend.entity.HorsePerformanceSummary;
import com.example.backend.entity.JockeyPerformanceSummary;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RaceResult;
import com.example.backend.entity.Registration;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorsePerformanceSummaryRepository;
import com.example.backend.repository.JockeyPerformanceSummaryRepository;
import com.example.backend.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PerformanceSummaryService {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final HorsePerformanceSummaryRepository horseSummaryRepository;
    private final JockeyPerformanceSummaryRepository jockeySummaryRepository;
    private final RegistrationRepository registrationRepository;

    public PerformanceSummaryService(
            HorsePerformanceSummaryRepository horseSummaryRepository,
            JockeyPerformanceSummaryRepository jockeySummaryRepository,
            RegistrationRepository registrationRepository
    ) {
        this.horseSummaryRepository = horseSummaryRepository;
        this.jockeySummaryRepository = jockeySummaryRepository;
        this.registrationRepository = registrationRepository;
    }

    public void updateAfterRaceApproved(
            List<RaceResult> results,
            Map<Integer, RaceEntry> entriesByRaceEntryId
    ) {
        Map<Integer, Registration> registrationsById = registrationRepository
                .findAllById(entriesByRaceEntryId.values()
                        .stream()
                        .map(RaceEntry::getRegistrationId)
                        .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(
                        Registration::getRegistrationId,
                        Function.identity()
                ));

        LocalDateTime now = LocalDateTime.now();
        for (RaceResult result : results) {
            RaceEntry entry = entriesByRaceEntryId.get(result.getRaceEntryId());
            if (entry == null) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Race result references an unknown race entry.");
            }

            Registration registration = registrationsById.get(entry.getRegistrationId());
            if (registration == null) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Race entry registration does not exist.");
            }
            if (registration.getJockeyId() == null) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Race entry registration does not have a jockey.");
            }

            updateHorseSummary(
                    registration.getHorseId(),
                    result.getFinishPosition(),
                    now);
            updateJockeySummary(
                    registration.getJockeyId(),
                    result.getFinishPosition(),
                    now);
        }
    }

    private void updateHorseSummary(
            Integer horseId,
            Integer finishPosition,
            LocalDateTime now
    ) {
        HorsePerformanceSummary summary = horseSummaryRepository.findById(horseId)
                .orElseGet(() -> HorsePerformanceSummary.builder()
                        .horseId(horseId)
                        .totalRaces(0)
                        .top1Count(0)
                        .top2Count(0)
                        .top3Count(0)
                        .violationCount(0)
                        .disqualifiedCount(0)
                        .build());

        summary.setTotalRaces(value(summary.getTotalRaces()) + 1);
        incrementTopCounts(summary, finishPosition);
        summary.setLastUpdatedAt(now);

        horseSummaryRepository.save(summary);
    }

    private void updateJockeySummary(
            Integer jockeyId,
            Integer finishPosition,
            LocalDateTime now
    ) {
        JockeyPerformanceSummary summary = jockeySummaryRepository.findById(jockeyId)
                .orElseGet(() -> JockeyPerformanceSummary.builder()
                        .jockeyId(jockeyId)
                        .totalRaces(0)
                        .top1Count(0)
                        .top2Count(0)
                        .top3Count(0)
                        .violationCount(0)
                        .disqualifiedCount(0)
                        .build());

        summary.setTotalRaces(value(summary.getTotalRaces()) + 1);
        incrementTopCounts(summary, finishPosition);
        summary.setWinRate(calculateWinRate(summary));
        summary.setLastUpdatedAt(now);

        jockeySummaryRepository.save(summary);
    }

    private void incrementTopCounts(HorsePerformanceSummary summary, Integer finishPosition) {
        if (Integer.valueOf(1).equals(finishPosition)) {
            summary.setTop1Count(value(summary.getTop1Count()) + 1);
        } else if (Integer.valueOf(2).equals(finishPosition)) {
            summary.setTop2Count(value(summary.getTop2Count()) + 1);
        } else if (Integer.valueOf(3).equals(finishPosition)) {
            summary.setTop3Count(value(summary.getTop3Count()) + 1);
        }
    }

    private void incrementTopCounts(JockeyPerformanceSummary summary, Integer finishPosition) {
        if (Integer.valueOf(1).equals(finishPosition)) {
            summary.setTop1Count(value(summary.getTop1Count()) + 1);
        } else if (Integer.valueOf(2).equals(finishPosition)) {
            summary.setTop2Count(value(summary.getTop2Count()) + 1);
        } else if (Integer.valueOf(3).equals(finishPosition)) {
            summary.setTop3Count(value(summary.getTop3Count()) + 1);
        }
    }

    private BigDecimal calculateWinRate(JockeyPerformanceSummary summary) {
        if (value(summary.getTotalRaces()) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(value(summary.getTop1Count()))
                .multiply(ONE_HUNDRED)
                .divide(BigDecimal.valueOf(summary.getTotalRaces()), 2, RoundingMode.HALF_UP);
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }
}
