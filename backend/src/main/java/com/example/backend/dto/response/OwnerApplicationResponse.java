package com.example.backend.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OwnerApplicationResponse {
    private Integer applicationId;
    private Integer userId;
    private String username;
    private String email;
    private String phone;
    private String stableName;
    private String stableAddress;
    private String stableCertificateUrl;
    private Integer totalHorsesOwned;
    private String horseOwnershipProofUrl;
    private String status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;
}
