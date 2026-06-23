package com.example.backend.entity;

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
@Table(name = "OwnerApplication")
public class OwnerApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "applicationID")
    private Integer applicationId;

    @Column(name = "userID", nullable = false)
    private Integer userId;

    @Column(name = "fullName", nullable = false)
    private String fullName;

    @Column(name = "dateOfBirth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "gender", nullable = false)
    private String gender;

    @Column(name = "nationality", nullable = false)
    private String nationality;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "rejectReason", length = 500)
    private String rejectReason;

    @Column(name = "submittedAt")
    private LocalDateTime submittedAt;

    @Column(name = "reviewedAt")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewedBy")
    private Integer reviewedBy;

    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (submittedAt == null) {
            submittedAt = now;
        }
        if (status == null) {
            status = "PENDING";
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
