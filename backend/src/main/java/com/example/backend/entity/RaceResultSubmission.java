package com.example.backend.entity;

import com.example.backend.constant.RaceResultSubmissionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RaceResultSubmission")
public class RaceResultSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submissionID")
    private Integer submissionId;

    @Column(name = "raceID", nullable = false)
    private Integer raceId;

    @Column(name = "submittedAt", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "submittedBy")
    private Integer submittedBy;

    @Column(name = "engineTokenIssuedAt")
    private LocalDateTime engineTokenIssuedAt;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "refereeReviewedAt")
    private LocalDateTime refereeReviewedAt;

    @Column(name = "refereeReviewedBy")
    private Integer refereeReviewedBy;

    @Column(name = "refereeComment", length = 1000)
    private String refereeComment;

    @Column(name = "adminReviewedAt")
    private LocalDateTime adminReviewedAt;

    @Column(name = "adminReviewedBy")
    private Integer adminReviewedBy;

    @Column(name = "adminComment", length = 1000)
    private String adminComment;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updatedAt", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (submittedAt == null) {
            submittedAt = now;
        }
        if (status == null) {
            status = RaceResultSubmissionStatus.SUBMITTED;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
