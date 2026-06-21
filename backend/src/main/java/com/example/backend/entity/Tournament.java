package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
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

    @Column(name = "tournamentName", nullable = false)
    private String tournamentName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "venue", nullable = false)
    private String venue;

    @Column(name = "venueImageUrl", length = 500)
    private String venueImageUrl;

    @Column(name = "registrationOpenAt", nullable = false)
    private LocalDateTime registrationOpenAt;

    @Column(name = "registrationCloseAt", nullable = false)
    private LocalDateTime registrationCloseAt;

    @Column(name = "startDate", nullable = false)
    private LocalDate startDate;

    @Column(name = "endDate", nullable = false)
    private LocalDate endDate;

    @Column(name = "maxRegistrations", nullable = false)
    private Integer maxRegistrations;

    @Column(name = "entryFee", nullable = false, precision = 12, scale = 2)
    private BigDecimal entryFee;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "createdBy", nullable = false)
    private Integer createdBy;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
