package com.example.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JockeyProfileResponse {
    private Integer jockeyId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private BigDecimal weight;
    private String ranking;
    private String biography;
    private Integer totalRaces;
    private Integer totalWins;
    private String trainerName;
    private String trainerEmail;
    private String academyStableAddress;
    private String issuingAuthority;
    private String verificationLink;
    private String licenceType;
    private LocalDate expiryDate;
    private String verificationStatus;
    private String rejectionReason;
    private Integer resubmitCount;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;
    private List<JockeyVerificationFileResponse> files;
}
