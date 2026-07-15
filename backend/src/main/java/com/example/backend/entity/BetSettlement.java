package com.example.backend.entity;

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
@Table(name = "BetSettlement")
public class BetSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "betSettlementID")
    private Integer betSettlementId;

    @Column(name = "betEventID", nullable = false, unique = true)
    private Integer betEventId;

    @Column(name = "totalStake", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalStake;

    @Column(name = "winningStake", nullable = false, precision = 14, scale = 2)
    private BigDecimal winningStake;

    @Column(name = "losingStake", nullable = false, precision = 14, scale = 2)
    private BigDecimal losingStake;

    @Column(name = "operatorFee", nullable = false, precision = 14, scale = 2)
    private BigDecimal operatorFee;

    @Column(name = "payoutPool", nullable = false, precision = 14, scale = 2)
    private BigDecimal payoutPool;

    @Column(name = "settledBy", nullable = false)
    private Integer settledBy;

    @Column(name = "settledAt", nullable = false)
    private LocalDateTime settledAt;

    @PrePersist
    void prePersist() {
        if (settledAt == null) {
            settledAt = LocalDateTime.now();
        }
    }
}
