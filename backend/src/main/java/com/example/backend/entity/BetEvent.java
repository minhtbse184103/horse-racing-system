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
@Table(name = "BetEvent")
public class BetEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "betEventID")
    private Integer betEventId;

    @Column(name = "raceID", nullable = false)
    private Integer raceId;

    @Column(name = "betProductID", nullable = false)
    private Integer betProductId;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "openAt", nullable = false)
    private LocalDateTime openAt;

    @Column(name = "closeAt", nullable = false)
    private LocalDateTime closeAt;

    @Column(name = "operatorFeeRate", nullable = false, precision = 5, scale = 4)
    private BigDecimal operatorFeeRate;

    @Column(name = "createdBy", nullable = false)
    private Integer createdBy;

    @Column(name = "settledBy")
    private Integer settledBy;

    @Column(name = "settledAt")
    private LocalDateTime settledAt;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

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
