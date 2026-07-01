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
@Table(name = "WalletTransaction")
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "walletTransactionID")
    private Integer walletTransactionId;

    @Column(name = "walletID", nullable = false)
    private Integer walletId;

    @Column(name = "userID", nullable = false)
    private Integer userId;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "balanceBefore", nullable = false, precision = 14, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balanceAfter", nullable = false, precision = 14, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "lockedBefore", nullable = false, precision = 14, scale = 2)
    private BigDecimal lockedBefore;

    @Column(name = "lockedAfter", nullable = false, precision = 14, scale = 2)
    private BigDecimal lockedAfter;

    @Column(name = "referenceType", length = 50)
    private String referenceType;

    @Column(name = "referenceID")
    private Integer referenceId;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
