package com.example.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "JockeyInvitation")
@Data
public class JockeyInvitation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "invitationID")
    private Integer invitationID;

    @OneToOne
    @JoinColumn(name = "regID")
    private Registration registration;

    @ManyToOne
    @JoinColumn(name = "ownerID")
    private User owner;

    @ManyToOne
    @JoinColumn(name = "jockeyID")
    private User jockey;

    @Column(name = "sentAt")
    private LocalDateTime sentAt;

    @Column(name = "respondedAt")
    private LocalDateTime respondedAt;

    @Column(name = "status")
    private String status;
}
