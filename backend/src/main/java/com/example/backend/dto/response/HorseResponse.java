package com.example.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HorseResponse {
    private Integer horseId;
    private Integer ownerId;
    private String passportNumber;
    private String horseName;
    private String breed;
    private String gender;
    private String color;
    private LocalDate dayOfBirth;
    private BigDecimal weight;
    private LocalDate healthCertExpiry;
    private String horsePassportUrl;
    private String healthCertificateUrl;
    private String horseImageUrl;
    private String status;
    private String rejectionReason;
    private long registrationCount;
    private boolean participated;
}
