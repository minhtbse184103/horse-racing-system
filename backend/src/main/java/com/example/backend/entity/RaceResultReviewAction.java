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

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "RaceResultReviewAction")
public class RaceResultReviewAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reviewActionID")
    private Integer reviewActionId;

    @Column(name = "submissionID", nullable = false)
    private Integer submissionId;

    @Column(name = "actorUserID", nullable = false)
    private Integer actorUserId;

    @Column(name = "actorRole", nullable = false, length = 50)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
