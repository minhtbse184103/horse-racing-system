package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "TournamentCondition")
public class TournamentCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conditionID")
    private Integer conditionId;

    @Column(name = "conditionName")
    private String conditionName;

    @Column(name = "maxHorseWeight")
    private BigDecimal maxHorseWeight;

    @Column(name = "maxJockeyWeight")
    private BigDecimal maxJockeyWeight;

    @Column(name = "description")
    private String description;
}