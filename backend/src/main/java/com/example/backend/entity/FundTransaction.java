package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
        name = "FundTransaction",
        uniqueConstraints = @UniqueConstraint(
                name = "FundTransaction_unique_reference",
                columnNames = {"fundKey", "transactionType", "referenceType", "referenceID"}
        )
)
public class FundTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fundTransactionID")
    private Long fundTransactionId;

    @Column(name = "fundKey", nullable = false, length = 80)
    private String fundKey;

    @Column(name = "tournamentID")
    private Integer tournamentId;

    @Column(name = "transactionType", nullable = false, length = 50)
    private String transactionType;

    @Column(name = "direction", nullable = false, length = 10)
    private String direction;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "balanceBefore", nullable = false, precision = 14, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balanceAfter", nullable = false, precision = 14, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "referenceType", nullable = false, length = 50)
    private String referenceType;

    @Column(name = "referenceID", nullable = false)
    private Integer referenceId;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
