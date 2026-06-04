package com.example.backend.entity;

import java.time.LocalDateTime;

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
@Table(name = "Registration")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "regID")
    private Integer regId;

    @Column(name = "raceID")
    private Integer raceId;

    @Column(name = "horseID")
    private Integer horseId;

    @Column(name = "ownerID")
    private Integer ownerId;

    @Column(name = "jockeyID")
    private Integer jockeyId;

    @Column(name = "registeredAt")
    private LocalDateTime registeredAt;

    @Column(name = "confirmedAt")
    private LocalDateTime confirmedAt;

    @Column(name = "status")
    private String status;
}
