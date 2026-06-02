package com.example.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "JockeyProfile")
@Data
public class JockeyProfile {
    @Id
    @Column(name = "jockeyID")
    private Integer jockeyID;

    @OneToOne
    @JoinColumn(name = "jockeyID", updatable = false, insertable = false)
    private User jockey;

    @Column(name = "licenseNo", nullable = false, unique = true)
    private String licenseNo;

    @Column(name = "weight", nullable = false)
    private Double weight;

    @Column(name = "ranking")
    private String ranking;

    @Column(name = "status")
    private String status;
}
