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
@Table(name = "BetTicket")
public class BetTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "betTicketID")
    private Integer betTicketId;

    @Column(name = "betEventID", nullable = false)
    private Integer betEventId;

    @Column(name = "userID", nullable = false)
    private Integer userId;

    @Column(name = "walletID", nullable = false)
    private Integer walletId;

    @Column(name = "raceID", nullable = false)
    private Integer raceId;

    @Column(name = "raceEntryID", nullable = false)
    private Integer raceEntryId;

    @Column(name = "stake", nullable = false, precision = 14, scale = 2)
    private BigDecimal stake;

    @Column(name = "estimatedOddsAtBet", precision = 10, scale = 4)
    private BigDecimal estimatedOddsAtBet;

    @Column(name = "finalOdds", precision = 10, scale = 4)
    private BigDecimal finalOdds;

    @Column(name = "payoutAmount", precision = 14, scale = 2)
    private BigDecimal payoutAmount;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "placedAt", nullable = false)
    private LocalDateTime placedAt;

    @Column(name = "settledAt")
    private LocalDateTime settledAt;

    @Column(name = "voidedAt")
    private LocalDateTime voidedAt;

    @Column(name = "refundReason", length = 500)
    private String refundReason;

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
