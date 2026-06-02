package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RaceRound")
public class RaceRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roundID")
    private Integer roundId;

    @Column(name = "raceID")
    private Integer raceId;

    @Column(name = "roundNumber")
    private Integer roundNumber;

    @Column(name = "distance")
    private Integer distance;

    @Column(name = "distanceCoefficient")
    private BigDecimal distanceCoefficient;

    @Column(name = "scheduledTime")
    private LocalDateTime scheduledTime;

    @Column(name = "status")
    private String status;
}
