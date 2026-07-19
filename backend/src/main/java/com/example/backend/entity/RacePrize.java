package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(
        name = "RacePrize",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "RacePrize_index_2",
                        columnNames = {"raceID", "rankPosition"}
                )
        }
)
public class RacePrize {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "racePrizeID")
    private Integer racePrizeId;

    @Column(name = "raceID", nullable = false)
    private Integer raceId;

    @Column(name = "rankPosition", nullable = false)
    private Integer rankPosition;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "ownerPercent", nullable = false, precision = 5, scale = 2)
    private BigDecimal ownerPercent;

    @Column(name = "jockeyPercent", nullable = false, precision = 5, scale = 2)
    private BigDecimal jockeyPercent;
}
