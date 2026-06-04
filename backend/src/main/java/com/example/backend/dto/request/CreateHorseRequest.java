package com.example.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateHorseRequest {

    @NotBlank(message = "Horse name is required")
    private String name;

    private String breed;

    private String gender;

    @PositiveOrZero(message = "Age must be zero or positive")
    private Integer age;

    @Positive(message = "Weight must be a positive number")
    private BigDecimal weight;

    private LocalDate healthCertExpiry;

    private String status;
}
