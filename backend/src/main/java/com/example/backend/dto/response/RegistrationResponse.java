package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class RegistrationResponse {

    private Integer registrationId;
    private String registrationNo;

    private Integer tournamentId;
    private String tournamentName;

    private Integer horseId;
    private String horseName;
    private String horseBreed;
    private String horseGender;
    private LocalDate horseDateOfBirth;
    private BigDecimal horseWeight;
    private LocalDate horseHealthCertExpiry;
    private String horseStatus;

    private Integer ownerId;
    private String ownerName;
    private String ownerEmail;

    private Integer jockeyId;
    private String jockeyName;
    private String jockeyEmail;

    private String paymentStatus;
    private String approvalStatus;
    private String rejectionReason;

    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;
    private String reviewerName;

    private boolean assigned;
    private Integer assignedRaceId;
    private String assignedRaceName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}