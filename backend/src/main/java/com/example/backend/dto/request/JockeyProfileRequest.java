package com.example.backend.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JockeyProfileRequest {

    @NotBlank(message = "License number is required")
    private String licenseNo;

    @NotNull(message = "Weight is required")
    @Positive(message = "Weight must be a positive number")
    private BigDecimal weight;

    private String ranking;

    private String status;
}
