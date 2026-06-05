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

    @Column(name = "trackSurface")
    private String trackSurface;

    @Column(name = "minHorseAge")
    private Integer minHorseAge;

    @Column(name = "allowedGender")
    private String allowedGender;

    @Column(name = "distanceText")
    private String distanceText;

    @Column(name = "distanceMeter")
    private Integer distanceMeter;

    @Column(name = "distanceType")
    private String distanceType;

    @Column(name = "description")
    private String description;
}
