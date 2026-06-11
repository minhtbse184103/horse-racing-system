package com.example.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "JockeyInvitation")
public class JockeyInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invitationID")
    private Integer invitationId;

    @Column(name = "registrationID")
    private Integer registrationId;

    @Column(name = "tournamentID", nullable = false)
    private Integer tournamentId;

    @Column(name = "horseID", nullable = false)
    private Integer horseId;

    @Column(name = "ownerID", nullable = false)
    private Integer ownerId;

    @Column(name = "jockeyID", nullable = false)
    private Integer jockeyId;

    @Column(name = "status")
    private String status;

    @Column(name = "message")
    private String message;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "expiredAt")
    private LocalDateTime expiredAt;

    @Column(name = "respondedAt")
    private LocalDateTime respondedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
