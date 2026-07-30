package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "BetProduct")
public class BetProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "betProductID")
    private Integer betProductId;

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "minStake", nullable = false, precision = 14, scale = 2)
    private BigDecimal minStake;

    @Column(name = "maxDailyStake", nullable = false, precision = 14, scale = 2)
    private BigDecimal maxDailyStake;

    @Column(name = "operatorFeeRate", nullable = false, precision = 5, scale = 4)
    private BigDecimal operatorFeeRate;

    @Column(name = "minimumOdds", nullable = false, precision = 10, scale = 4)
    private BigDecimal minimumOdds;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (minStake == null) {
            minStake = new BigDecimal("10000.00");
        }
        if (maxDailyStake == null) {
            maxDailyStake = new BigDecimal("1000000.00");
        }
        if (operatorFeeRate == null) {
            operatorFeeRate = new BigDecimal("0.1000");
        }
        if (minimumOdds == null) {
            minimumOdds = new BigDecimal("1.0500");
        }
        if (active == null) {
            active = true;
        }
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
