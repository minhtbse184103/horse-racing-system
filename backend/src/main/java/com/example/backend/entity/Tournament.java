package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "Tournament")
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tournamentID")
    private Integer tournamentId;

    @Column(name = "tournamentName")
    private String tournamentName;

    @Column(name = "location")
    private String location;

    @Column(name = "startDate")
    private LocalDate startDate;

    @Column(name = "endDate")
    private LocalDate endDate;

    @Column(name = "registrationDeadline")
    private LocalDateTime registrationDeadline;

    @Column(name = "minParticipants")
    private Integer minParticipants;

    @Column(name = "maxParticipants")
    private Integer maxParticipants;

    @Column(name = "conditionID")
    private Integer conditionId;

    @Column(name = "status")
    private String status;

    @Column(name = "createdBy")
    private Integer createdBy;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}