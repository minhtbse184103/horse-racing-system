package com.example.backend.service;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.response.HorsePerformanceResponse;
import com.example.backend.dto.response.JockeyPerformanceResponse;
import com.example.backend.entity.HorsePerformanceSummary;
import com.example.backend.entity.JockeyPerformanceSummary;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorsePerformanceSummaryRepository;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyPerformanceSummaryRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class PublicPerformanceServiceImpl implements PublicPerformanceService {
    private static final String ROLE_JOCKEY = "JOCKEY";

    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final HorsePerformanceSummaryRepository horseSummaryRepository;
    private final JockeyPerformanceSummaryRepository jockeySummaryRepository;

    public PublicPerformanceServiceImpl(
            HorseRepository horseRepository,
            UserRepository userRepository,
            HorsePerformanceSummaryRepository horseSummaryRepository,
            JockeyPerformanceSummaryRepository jockeySummaryRepository
    ) {
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.horseSummaryRepository = horseSummaryRepository;
        this.jockeySummaryRepository = jockeySummaryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<HorsePerformanceResponse> getHorsePerformance(Integer horseId) {
        if (!horseRepository.existsById(horseId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Horse does not exist.");
        }

        HorsePerformanceSummary summary = horseSummaryRepository.findById(horseId)
                .orElse(null);
        return ApiResponse.<HorsePerformanceResponse>builder()
                .status(true)
                .message("Horse performance retrieved successfully.")
                .data(mapHorsePerformance(horseId, summary))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<JockeyPerformanceResponse> getJockeyPerformance(Integer jockeyId) {
        User jockey = userRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey does not exist."));
        if (jockey.getRole() == null || !ROLE_JOCKEY.equals(jockey.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Jockey does not exist.");
        }

        JockeyPerformanceSummary summary = jockeySummaryRepository.findById(jockeyId)
                .orElse(null);
        return ApiResponse.<JockeyPerformanceResponse>builder()
                .status(true)
                .message("Jockey performance retrieved successfully.")
                .data(mapJockeyPerformance(jockeyId, summary))
                .build();
    }

    private HorsePerformanceResponse mapHorsePerformance(
            Integer horseId,
            HorsePerformanceSummary summary
    ) {
        return HorsePerformanceResponse.builder()
                .horseId(horseId)
                .totalRaces(summary != null ? value(summary.getTotalRaces()) : 0)
                .top1Count(summary != null ? value(summary.getTop1Count()) : 0)
                .top2Count(summary != null ? value(summary.getTop2Count()) : 0)
                .top3Count(summary != null ? value(summary.getTop3Count()) : 0)
                .violationCount(summary != null ? value(summary.getViolationCount()) : 0)
                .disqualifiedCount(summary != null ? value(summary.getDisqualifiedCount()) : 0)
                .lastUpdatedAt(summary != null ? summary.getLastUpdatedAt() : null)
                .build();
    }

    private JockeyPerformanceResponse mapJockeyPerformance(
            Integer jockeyId,
            JockeyPerformanceSummary summary
    ) {
        return JockeyPerformanceResponse.builder()
                .jockeyId(jockeyId)
                .totalRaces(summary != null ? value(summary.getTotalRaces()) : 0)
                .top1Count(summary != null ? value(summary.getTop1Count()) : 0)
                .top2Count(summary != null ? value(summary.getTop2Count()) : 0)
                .top3Count(summary != null ? value(summary.getTop3Count()) : 0)
                .winRate(summary != null && summary.getWinRate() != null
                        ? summary.getWinRate()
                        : BigDecimal.ZERO)
                .violationCount(summary != null ? value(summary.getViolationCount()) : 0)
                .disqualifiedCount(summary != null ? value(summary.getDisqualifiedCount()) : 0)
                .lastUpdatedAt(summary != null ? summary.getLastUpdatedAt() : null)
                .build();
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }
}
