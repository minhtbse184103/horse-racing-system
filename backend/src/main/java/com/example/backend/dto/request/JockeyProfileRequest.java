package com.example.backend.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JockeyProfileRequest {

    @NotBlank(message = "License number is required")
    @Size(min = 5, max = 50, message = "License number must be between 5 and 50 characters")
    @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "License number may contain only letters, numbers and hyphens")
    private String licenseNo;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "35.00", message = "Jockey weight must be at least 35 kg")
    @DecimalMax(value = "90.00", message = "Jockey weight must not exceed 90 kg")
    private BigDecimal weight;

    @NotBlank(message = "Ranking is required")
    @Pattern(regexp = "(?i)BEGINNER|INTERMEDIATE|PROFESSIONAL|ELITE", message = "Ranking must be BEGINNER, INTERMEDIATE, PROFESSIONAL or ELITE")
    private String ranking;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "(?i)ACTIVE|INACTIVE", message = "Status must be ACTIVE or INACTIVE")
    private String status;

    @NotBlank(message = "Image URL is required")
    @Size(max = 255, message = "Image URL must not exceed 255 characters")
    @Pattern(regexp = "^https?://.+$", message = "Image URL must be a valid HTTP or HTTPS URL")
    private String imgUrl;
}
