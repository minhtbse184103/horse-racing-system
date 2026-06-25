package com.example.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
@Table(name = "Horse")
public class Horse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "horseID")
    private Integer horseId;

    @Column(name = "ownerID", nullable = false)
    private Integer ownerId;

    @Column(name = "horseName", nullable = false, unique = true)
    private String horseName;

    @Column(name = "age", nullable = false)
    private Integer age;

    @Column(name = "weight", nullable = false)
    private BigDecimal weight;

    @Column(name = "colour", nullable = false)
    private String colour;

    @Column(name = "sex", nullable = false)
    private String sex;

    @Column(name = "breeding", nullable = false)
    private String breeding;

    @Column(name = "trainer", nullable = false)
    private String trainer;

    @Column(name = "healthCertExpiry", nullable = false)
    private LocalDate healthCertExpiry;

    @Column(name = "healthCertificateUrl", nullable = false, columnDefinition = "TEXT")
    private String healthCertificateUrl;

    @Column(name = "officialHorseProfileUrl", nullable = false, columnDefinition = "TEXT")
    private String officialHorseProfileUrl;

    @Column(name = "status")
    private String status;

    @Column(name = "rejectionReason", length = 500)
    private String rejectionReason;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = "PENDING";
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
