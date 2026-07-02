package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RaceResultSubmissionEntry")
public class RaceResultSubmissionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submissionEntryID")
    private Integer submissionEntryId;

    @Column(name = "submissionID", nullable = false)
    private Integer submissionId;

    @Column(name = "raceEntryID", nullable = false)
    private Integer raceEntryId;

    @Column(name = "startingStall", nullable = false)
    private Integer startingStall;

    @Column(name = "finishPosition", nullable = false)
    private Integer finishPosition;

    @Column(name = "finishTime", nullable = false, length = 50)
    private String finishTime;

    @Column(name = "points")
    private Integer points;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (points == null) {
            points = 0;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
