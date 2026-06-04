package com.example.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

    @Column(name = "regID")
    private Integer regId;

    @Column(name = "ownerID")
    private Integer ownerId;

    @Column(name = "jockeyID")
    private Integer jockeyId;

    @Column(name = "sentAt")
    private LocalDateTime sentAt;

    @Column(name = "respondedAt")
    private LocalDateTime respondedAt;

    @Column(name = "expiredAt")
    private LocalDateTime expiredAt;

    @Column(name = "status")
    private String status;
}
