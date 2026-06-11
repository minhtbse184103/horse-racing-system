package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "TournamentRound")
public class TournamentRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roundID")
    private Integer roundId;

    @Column(name = "tournamentID")
    private Integer tournamentId;

    @Column(name = "roundName")
    private String roundName;

    @Column(name = "roundOrder")
    private Integer roundOrder;

    @Column(name = "status")
    private String status;
}