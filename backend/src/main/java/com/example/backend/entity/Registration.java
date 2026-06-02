package com.example.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "Registration")
@Data
public class Registration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "regID")
    private Integer regID;

    @ManyToOne
    @JoinColumn(name = "raceID")
    private Race race;

    @ManyToOne
    @JoinColumn(name = "horseID")
    private Horse horse;

    @ManyToOne
    @JoinColumn(name = "ownerID")
    private User owner;

    @ManyToOne
    @JoinColumn(name = "jockeyID")
    private User jockey;

    @Column(name = "registeredAt")
    private LocalDateTime registeredAt;

    @Column(name = "confirmedAt")
    private LocalDateTime confirmedAt;

    @Column(name = "status")
    private String status;
}
