package com.example.backend.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Future;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminRoleApprovalRequest {

    @AssertTrue(message = "Admin must confirm KYC review before approving this role.")
    private Boolean confirmKycReviewed;

    @Future(message = "KYC expiry time must be in the future.")
    private LocalDateTime kycExpiresAt;
}
