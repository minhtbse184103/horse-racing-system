package com.example.backend.service;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.response.JockeyPerformanceResponse;
import com.example.backend.dto.response.PublicJockeyProfileResponse;
import com.example.backend.entity.JockeyPerformanceSummary;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.JockeyVerification;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyPerformanceSummaryRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.JockeyVerificationRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class PublicJockeyServiceImpl implements PublicJockeyService {
    private static final String ROLE_JOCKEY = "JOCKEY";

    private final UserRepository userRepository;
    private final JockeyProfileRepository jockeyProfileRepository;
    private final JockeyVerificationRepository jockeyVerificationRepository;
    private final JockeyPerformanceSummaryRepository jockeySummaryRepository;

    public PublicJockeyServiceImpl(
            UserRepository userRepository,
            JockeyProfileRepository jockeyProfileRepository,
            JockeyVerificationRepository jockeyVerificationRepository,
            JockeyPerformanceSummaryRepository jockeySummaryRepository
    ) {
        this.userRepository = userRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.jockeyVerificationRepository = jockeyVerificationRepository;
        this.jockeySummaryRepository = jockeySummaryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ApiResponse<PublicJockeyProfileResponse> getJockeyProfile(Integer jockeyId) {
        User jockey = getJockey(jockeyId);
        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey profile does not exist."));
        JockeyVerification verification = jockeyVerificationRepository
                .findFirstByJockeyIdOrderByCreatedAtDesc(jockeyId)
                .orElse(null);
        JockeyPerformanceSummary summary = jockeySummaryRepository.findById(jockeyId)
                .orElse(null);

        return ApiResponse.<PublicJockeyProfileResponse>builder()
                .status(true)
                .message("Jockey profile retrieved successfully.")
                .data(mapJockeyProfile(jockey, profile, verification, summary))
                .build();
    }

    private User getJockey(Integer jockeyId) {
        User jockey = userRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey does not exist."));
        if (jockey.getRole() == null || !ROLE_JOCKEY.equals(jockey.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Jockey does not exist.");
        }
        return jockey;
    }

    private PublicJockeyProfileResponse mapJockeyProfile(
            User jockey,
            JockeyProfile profile,
            JockeyVerification verification,
            JockeyPerformanceSummary summary
    ) {
        JockeyPerformanceResponse performance = mapJockeyPerformance(jockey.getUserID(), summary);
        return PublicJockeyProfileResponse.builder()
                .jockeyId(jockey.getUserID())
                .fullName(profile.getFullName())
                .biography(profile.getBiography())
                .weight(profile.getWeight())
                .totalRaces(summary != null ? value(summary.getTotalRaces()) : value(profile.getTotalRaces()))
                .totalWins(summary != null ? value(summary.getTop1Count()) : value(profile.getTotalWins()))
                .verificationStatus(verification != null ? verification.getVerificationStatus() : null)
                .licenceType(verification != null ? verification.getLicenceType() : null)
                .performance(performance)
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
