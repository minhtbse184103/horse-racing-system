package com.example.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
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
@Table(name = "PaymentTransaction")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "paymentTransactionID")
    private Integer paymentTransactionId;

    @Column(name = "userID", nullable = false)
    private Integer userId;

    @Column(name = "registrationID", nullable = false)
    private Integer registrationId;

    @Column(name = "purpose", nullable = false, length = 50)
    private String purpose;

    @Column(name = "provider", nullable = false, length = 50)
    private String provider;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Column(name = "txnRef", nullable = false, unique = true, length = 100)
    private String txnRef;

    @Column(name = "providerTransactionNo", length = 100)
    private String providerTransactionNo;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Lob
    @Column(name = "payUrl")
    private String payUrl;

    @Column(name = "responseCode", length = 20)
    private String responseCode;

    @Lob
    @Column(name = "rawResponse")
    private String rawResponse;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "paidAt")
    private LocalDateTime paidAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
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
