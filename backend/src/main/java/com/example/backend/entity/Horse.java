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

    @Column(name = "horseName", nullable = false)
    private String horseName;

    @Column(name = "breed")
    private String breed;

    @Column(name = "gender")
    private String gender;

    @Column(name = "color")
    private String color;

    @Column(name = "dayOfBirth")
    private LocalDate dayOfBirth;

    @Column(name = "weight", nullable = false)
    private BigDecimal weight;

    @Column(name = "healthCertExpiry")
    private LocalDate healthCertExpiry;

    @Column(name = "status")
    private String status;

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
            status = "ACTIVE";
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
