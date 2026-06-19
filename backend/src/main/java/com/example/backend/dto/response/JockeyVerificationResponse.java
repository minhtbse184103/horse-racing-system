package com.example.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JockeyVerificationResponse {
    private Integer verificationId;
    private Integer jockeyId;
    private String jockeyFullName;
    private String jockeyEmail;
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
