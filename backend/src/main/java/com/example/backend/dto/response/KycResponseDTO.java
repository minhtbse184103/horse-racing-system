package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class KycResponseDTO {
    private Integer verificationId;
    private Integer userId;
    private String username;
    private String email;
    private String status;
    private String fullName;
    private LocalDate dateOfBirth;
    private String identityNumber;
    private String identityFrontUrl;
    private String identityBackUrl;
    private String selfieUrl;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;
    private String rejectionReason;
    private LocalDateTime expiresAt;
}
