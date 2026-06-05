package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "Race")
public class Race {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "raceID")
    private Integer raceId;

    @Column(name = "tournamentID")
    private Integer tournamentId;

    @Column(name = "categoryID")
    private Integer categoryId;

    @Column(name = "scheduledTime")
    private LocalDateTime scheduledTime;

    @Column(name = "raceNumber")
    private Integer raceNumber;

    @Column(name = "maxParticipants")
    private Integer maxParticipants;

    @Column(name = "laneCount")
    private Integer laneCount;

    @Column(name = "prizePool")
    private BigDecimal prizePool;

    @Column(name = "status")
    private String status;
}
