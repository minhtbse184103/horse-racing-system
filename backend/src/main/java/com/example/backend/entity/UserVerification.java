package com.example.backend.entity;

import com.example.backend.enums.KycStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_verifications", indexes = {
        @Index(name = "idx_user_verifications_user_attempt", columnList = "user_id,attempt_number"),
        @Index(name = "idx_user_verifications_status", columnList = "status")
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class UserVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "verification_id")
    private Integer verificationId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "provider", nullable = false, length = 30)
    private String provider;

    @Column(name = "provider_session_id", nullable = false, unique = true, length = 100)
    private String providerSessionId;

    @Column(name = "provider_session_number")
    private Long providerSessionNumber;

    @Column(name = "workflow_id", nullable = false, length = 100)
    private String workflowId;

    @Column(name = "vendor_data", nullable = false, length = 100)
    private String vendorData;

    @Column(name = "verification_url", columnDefinition = "TEXT")
    private String verificationUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private KycStatus status;

    @Column(name = "id_verification_status", length = 40)
    private String idVerificationStatus;

    @Column(name = "liveness_status", length = 40)
    private String livenessStatus;

    @Column(name = "face_match_status", length = 40)
    private String faceMatchStatus;

    @Column(name = "ip_analysis_status", length = 40)
    private String ipAnalysisStatus;

    @Column(name = "verified_full_name", length = 150)
    private String verifiedFullName;

    @Column(name = "verified_date_of_birth")
    private LocalDate verifiedDateOfBirth;

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "document_last_four", length = 4)
    private String documentLastFour;

    @Column(name = "document_expiry_date")
    private LocalDate documentExpiryDate;

    @Column(name = "face_match_score", precision = 8, scale = 4)
    private BigDecimal faceMatchScore;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (submittedAt == null) submittedAt = now;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getFullName() { return verifiedFullName; }
    public LocalDate getDateOfBirth() { return verifiedDateOfBirth; }
}
