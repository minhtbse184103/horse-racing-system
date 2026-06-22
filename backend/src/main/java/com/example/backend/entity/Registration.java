package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Registration")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registrationID")
    private Integer registrationId;

    @Column(name = "tournamentID", nullable = false)
    private Integer tournamentId;

    @Column(name = "horseID", nullable = false)
    private Integer horseId;

    @Column(name = "ownerID", nullable = false)
    private Integer ownerId;

    @Column(name = "jockeyID")
    private Integer jockeyId;

    @Column(name = "registrationNo", nullable = false, unique = true, length = 100)
    private String registrationNo;

    @Column(name = "paymentStatus", nullable = false, length = 50)
    private String paymentStatus;

    @Column(name = "approvalStatus", nullable = false, length = 50)
    private String approvalStatus;

    @Column(name = "rejectionReason", length = 500)
    private String rejectionReason;

    @Column(name = "submittedAt", nullable = false)
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

        if (submittedAt == null) {
            submittedAt = now;
        }

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Temporary compatibility methods for legacy Owner/Jockey code.
     * Do not use these methods in the new registration flow.
     */
    @Deprecated
    public String getStatus() {
        return approvalStatus;
    }

    @Deprecated
    public void setStatus(String status) {
        this.approvalStatus = status;
    }
}