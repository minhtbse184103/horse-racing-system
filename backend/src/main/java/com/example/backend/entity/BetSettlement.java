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

    @Column(name = "grossPool", nullable = false, precision = 14, scale = 2)
    private BigDecimal grossPool;

    @Column(name = "netPool", nullable = false, precision = 14, scale = 2)
    private BigDecimal netPool;

    @Column(name = "rawOdds", precision = 10, scale = 4)
    private BigDecimal rawOdds;

    @Column(name = "minimumOdds", nullable = false, precision = 10, scale = 4)
    private BigDecimal minimumOdds;

    @Column(name = "finalOdds", precision = 10, scale = 4)
    private BigDecimal finalOdds;

    @Column(name = "totalPayout", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPayout;

    @Column(name = "subsidyAmount", nullable = false, precision = 14, scale = 2)
    private BigDecimal subsidyAmount;

    @Column(name = "roundingAdjustment", nullable = false, precision = 14, scale = 2)
    private BigDecimal roundingAdjustment;

    @Column(name = "outcome", nullable = false, length = 30)
    private String outcome;

    @Column(name = "voidReason", length = 500)
    private String voidReason;

    @Column(name = "settledBy", nullable = false)
    private Integer settledBy;

    @Column(name = "settledAt", nullable = false)
    private LocalDateTime settledAt;

    @PrePersist
    void prePersist() {
        if (settledAt == null) {
            settledAt = LocalDateTime.now();
        }
        if (grossPool == null) grossPool = totalStake != null ? totalStake : BigDecimal.ZERO;
        if (netPool == null) netPool = payoutPool != null ? payoutPool : BigDecimal.ZERO;
        if (minimumOdds == null) minimumOdds = new BigDecimal("1.0500");
        if (totalPayout == null) totalPayout = BigDecimal.ZERO;
        if (subsidyAmount == null) subsidyAmount = BigDecimal.ZERO;
        if (roundingAdjustment == null) roundingAdjustment = BigDecimal.ZERO;
        if (outcome == null) outcome = "PAID";
    }
}
