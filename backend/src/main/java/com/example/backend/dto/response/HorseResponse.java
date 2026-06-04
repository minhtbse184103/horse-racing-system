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
    private String name;
    private String breed;
    private String gender;
    private Integer age;
    private BigDecimal weight;
    private LocalDate healthCertExpiry;
    private String status;
    private long registrationCount;
    private boolean participated;
}
