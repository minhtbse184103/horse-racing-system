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
@Table(name = "SystemFund")
public class SystemFund {

    public static final Integer SINGLETON_ID = 1;

    @Id
    @Column(name = "systemFundID")
    private Integer systemFundId;

    @Column(name = "balance", nullable = false, precision = 14, scale = 2)
    private BigDecimal balance;

    @Column(name = "bettingFeeRevenue", nullable = false, precision = 14, scale = 2)
    private BigDecimal bettingFeeRevenue;

    @Column(name = "minusPoolSubsidyPaid", nullable = false, precision = 14, scale = 2)
    private BigDecimal minusPoolSubsidyPaid;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updatedAt", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (systemFundId == null) systemFundId = SINGLETON_ID;
        if (balance == null) balance = BigDecimal.ZERO;
        if (bettingFeeRevenue == null) bettingFeeRevenue = BigDecimal.ZERO;
        if (minusPoolSubsidyPaid == null) minusPoolSubsidyPaid = BigDecimal.ZERO;
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
