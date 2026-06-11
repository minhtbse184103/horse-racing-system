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
@Table(name = "RaceEntry")
public class RaceEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "raceEntryID")
    private Integer raceEntryId;

    @Column(name = "raceID", nullable = false)
    private Integer raceId;

    @Column(name = "registrationID", nullable = false)
    private Integer registrationId;

    @Column(name = "laneNumber")
    private Integer laneNumber;

    @Column(name = "status")
    private String status;
}
