package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RefereeAssignment")
public class RefereeAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignmentID")
    private Integer assignmentId;

    @Column(name = "raceID", nullable = false, unique = true)
    private Integer raceId;

    @Column(name = "refereeUserID", nullable = false)
    private Integer refereeUserId;

    @Column(name = "assignedAt")
    private LocalDateTime assignedAt;

    @Column(name = "status")
    private String status;

    @PrePersist
    void prePersist() {
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }

        if (status == null) {
            status = "ASSIGNED";
        }
    }
}