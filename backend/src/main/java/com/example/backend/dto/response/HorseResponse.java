package com.example.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HorseResponse {
    private Integer horseId;
    private Integer ownerId;
    private String horseName;
    private Integer age;
    private BigDecimal weight;
    private String colour;
    private String sex;
    private String breeding;
    private String trainer;
    private LocalDate healthCertExpiry;
    private String healthCertificateUrl;
    private String officialHorseProfileUrl;
    private String status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long registrationCount;
    private boolean participated;
}
