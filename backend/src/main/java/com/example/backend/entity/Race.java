package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
        name = "Race",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "Race_index_0",
                        columnNames = {"tournamentID", "raceName"}
                ),
                @UniqueConstraint(
                        name = "Race_index_1",
                        columnNames = {"tournamentID", "raceOrder"}
                )
        }
)
public class Race {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "raceID")
    private Integer raceId;

    @Column(name = "tournamentID", nullable = false)
    private Integer tournamentId;

    @Column(name = "raceName", nullable = false)
    private String raceName;

    @Column(name = "trackName", nullable = false)
    private String trackName;

    @Column(name = "raceStartTime", nullable = false)
    private LocalDateTime raceStartTime;

    @Column(name = "raceEndTime")
    private LocalDateTime raceEndTime;

    @Column(name = "distance", nullable = false)
    private Integer distance;

    @Column(name = "maxRunners", nullable = false)
    private Integer maxRunners;

    @Column(name = "raceOrder")
    private Integer raceOrder;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

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