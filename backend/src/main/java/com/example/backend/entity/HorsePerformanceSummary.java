package com.example.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "HorsePerformanceSummary")
public class HorsePerformanceSummary {

    @Id
    @Column(name = "horseID")
    private Integer horseId;

    @Column(name = "totalRaces")
    private Integer totalRaces;

    @Column(name = "top1Count")
    private Integer top1Count;

    @Column(name = "top2Count")
    private Integer top2Count;

    @Column(name = "top3Count")
    private Integer top3Count;

    @Column(name = "bestTime")
    private BigDecimal bestTime;

    @Column(name = "violationCount")
    private Integer violationCount;

    @Column(name = "disqualifiedCount")
    private Integer disqualifiedCount;

    @Column(name = "lastUpdatedAt")
    private LocalDateTime lastUpdatedAt;
}
