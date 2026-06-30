package com.example.backend.entity;

import com.example.backend.constant.PrizeDistributionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "PrizeDistribution")
public class PrizeDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prizeDistributionID")
    private Integer prizeDistributionId;

    @Column(name = "raceID", nullable = false)
    private Integer raceId;

    @Column(name = "raceEntryID", nullable = false)
    private Integer raceEntryId;

    @Column(name = "racePrizeID", nullable = false)
    private Integer racePrizeId;

    @Column(name = "ownerID", nullable = false)
    private Integer ownerId;

    @Column(name = "jockeyID", nullable = false)
    private Integer jockeyId;

    @Column(name = "totalPrize", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrize;

    @Column(name = "ownerAmount", nullable = false, precision = 12, scale = 2)
    private BigDecimal ownerAmount;

    @Column(name = "jockeyAmount", nullable = false, precision = 12, scale = 2)
    private BigDecimal jockeyAmount;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "distributedAt")
    private LocalDateTime distributedAt;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (status == null) {
            status = PrizeDistributionStatus.PENDING;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
