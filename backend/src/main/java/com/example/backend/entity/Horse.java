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

    @Column(name = "passportNumber", nullable = false, unique = true)
    private String passportNumber;

    @Column(name = "horseName", nullable = false, unique = true)
    private String horseName;

    @Column(name = "breed", nullable = false)
    private String breed;

    @Column(name = "gender", nullable = false)
    private String gender;

    @Column(name = "color", nullable = false)
    private String color;

    @Column(name = "dayOfBirth", nullable = false)
    private LocalDate dayOfBirth;

    @Column(name = "weight", nullable = false)
    private BigDecimal weight;

    @Column(name = "healthCertExpiry", nullable = false)
    private LocalDate healthCertExpiry;

    @Column(name = "horsePassportUrl", nullable = false, columnDefinition = "TEXT")
    private String horsePassportUrl;

    @Column(name = "healthCertificateUrl", nullable = false, columnDefinition = "TEXT")
    private String healthCertificateUrl;

    @Column(name = "horseImageUrl", nullable = false, columnDefinition = "TEXT")
    private String horseImageUrl;

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
