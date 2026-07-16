package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class KycResponseDTO {
    private Integer verificationId;
    private String provider;
    private String status;
    private String verificationUrl;
    private Integer attemptNumber;
    private String verifiedFullName;
    private LocalDate verifiedDateOfBirth;
    private String documentType;
    private String documentLastFour;
    private LocalDate documentExpiryDate;
    private String rejectionReason;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
    private LocalDateTime expiresAt;
    private boolean walletOpen;
}
