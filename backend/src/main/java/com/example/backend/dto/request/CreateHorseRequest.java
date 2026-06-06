package com.example.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateHorseRequest {

    @NotBlank(message = "Horse name is required")
    private String horseName;

    private String breed;

    private String gender;

    private String color;

    private LocalDate dayOfBirth;

    @NotNull(message = "Weight is required")
    @Positive(message = "Weight must be a positive number")
    private BigDecimal weight;

    private LocalDate healthCertExpiry;

    private String status;
}
