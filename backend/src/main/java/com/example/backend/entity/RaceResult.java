package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RaceResult")
public class RaceResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resultID")
    private Integer resultId;

    @Column(name = "raceEntryID", nullable = false, unique = true)
    private Integer raceEntryId;

    @Column(name = "finishPosition", nullable = false)
    private Integer finishPosition;

    @Column(name = "finishTime", length = 50)
    private String finishTime;

    @Column(name = "points")
    private Integer points;

    @Column(name = "prizeMoney", precision = 12, scale = 2)
    private BigDecimal prizeMoney;

    @Column(name = "recordedAt")
    private LocalDateTime recordedAt;

    @Column(name = "recordedBy", nullable = false)
    private Integer recordedBy;

    @PrePersist
    void prePersist() {
        if (points == null) {
            points = 0;
        }
        if (prizeMoney == null) {
            prizeMoney = BigDecimal.ZERO;
        }
        if (recordedAt == null) {
            recordedAt = LocalDateTime.now();
        }
    }
}
