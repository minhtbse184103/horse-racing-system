package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "TournamentFund")
public class TournamentFund {

    @Id
    @Column(name = "tournamentID")
    private Integer tournamentId;

    @Column(name = "collectedAmount", nullable = false, precision = 14, scale = 2)
    private BigDecimal collectedAmount;

    @Column(name = "paidPrizeAmount", nullable = false, precision = 14, scale = 2)
    private BigDecimal paidPrizeAmount;

    @Column(name = "availableBalance", nullable = false, precision = 14, scale = 2)
    private BigDecimal availableBalance;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updatedAt", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (collectedAmount == null) collectedAmount = BigDecimal.ZERO;
        if (paidPrizeAmount == null) paidPrizeAmount = BigDecimal.ZERO;
        if (availableBalance == null) availableBalance = BigDecimal.ZERO;
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
