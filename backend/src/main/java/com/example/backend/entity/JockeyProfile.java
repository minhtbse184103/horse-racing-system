package com.example.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "JockeyProfile")
public class JockeyProfile {

    @Id
    @Column(name = "jockeyID")
    private Integer jockeyId;

    @Column(name = "licenseNo", nullable = false, unique = true)
    private String licenseNo;

    @Column(name = "weight", nullable = false)
    private BigDecimal weight;

    @Column(name = "ranking")
    private String ranking;

    @Column(name = "status")
    private String status;
}
