package com.example.backend.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JockeyProfileRequest {

    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    @NotNull(message = "Cân nặng là bắt buộc")
    @DecimalMin(value = "35.00", message = "Cân nặng của nài ngựa phải ít nhất là 35 kg")
    @DecimalMax(value = "90.00", message = "Cân nặng của nài ngựa không được vượt quá 90 kg")
    private BigDecimal weight;

    private String ranking;

    private String biography;

    private String phoneNumber;

    private Integer totalRaces;

    private Integer totalWins;
}
