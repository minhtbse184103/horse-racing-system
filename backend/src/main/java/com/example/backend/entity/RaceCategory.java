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
@Table(name = "RaceCategory")
public class RaceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "categoryID")
    private Integer categoryId;

    @Column(name = "categoryName")
    private String categoryName;

    @Column(name = "maxHorseWeight")
    private Double maxHorseWeight;

    @Column(name = "maxJockeyWeight")
    private Double maxJockeyWeight;

    @Column(name = "minRounds")
    private Integer minRounds;

    @Column(name = "maxRounds")
    private Integer maxRounds;

    @Column(name = "description")
    private String description;
}
