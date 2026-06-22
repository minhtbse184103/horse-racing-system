package com.example.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "JockeyVerification")
public class JockeyVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "verificationID")
    private Integer verificationId;

    @Column(name = "jockeyID", nullable = false)
    private Integer jockeyId;

    @Column(name = "trainerName", nullable = false)
    private String trainerName;

    @Column(name = "trainerEmail", nullable = false)
    private String trainerEmail;

    @Column(name = "academyStableAddress", length = 500)
    private String academyStableAddress;

    @Column(name = "issuingAuthority", nullable = false)
    private String issuingAuthority;

    @Column(name = "verificationLink", columnDefinition = "TEXT")
    private String verificationLink;

    @Column(name = "licenceType", length = 50)
    private String licenceType;

    @Column(name = "expiryDate")
    private LocalDate expiryDate;

    @Column(name = "verificationStatus", length = 50)
    private String verificationStatus;

    @Column(name = "rejectionReason", length = 500)
    private String rejectionReason;

    @Column(name = "resubmitCount")
    private Integer resubmitCount;

    @Column(name = "submittedAt")
    private LocalDateTime submittedAt;

    @Column(name = "reviewedAt")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewedBy")
    private Integer reviewedBy;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (verificationStatus == null) {
            verificationStatus = "PENDING";
        }
        if (resubmitCount == null) {
            resubmitCount = 0;
        }
        if (submittedAt == null) {
            submittedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
