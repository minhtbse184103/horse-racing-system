package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.example.backend.constant.RaceEntryStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RaceEntry")
public class RaceEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "raceEntryID")
    private Integer raceEntryId;

    @Column(name = "raceID", nullable = false)
    private Integer raceId;

    @Column(name = "registrationID", nullable = false)
    private Integer registrationId;

    @Column(name = "startingStall", nullable = false)
    private Integer startingStall;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "assignedBy", nullable = false)
    private Integer assignedBy;

    @Column(name = "assignedAt", nullable = false)
    private LocalDateTime assignedAt;

    @Column(name = "cancelledAt")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelledBy")
    private Integer cancelledBy;

    @Column(name = "cancellationReason", length = 500)
    private String cancellationReason;

    @PrePersist
    void prePersist() {
        if (status == null) {
            status = RaceEntryStatus.ASSIGNED;
        }
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }
    }
}