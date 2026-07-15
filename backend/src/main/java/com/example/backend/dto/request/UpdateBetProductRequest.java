package com.example.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateBetProductRequest {

    @NotBlank(message = "Product name is required.")
    @Size(max = 100, message = "Product name cannot exceed 100 characters.")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters.")
    private String description;

    @NotNull(message = "Minimum stake is required.")
    @DecimalMin(value = "10000.00", message = "Minimum stake must be at least 10,000 VND.")
    private BigDecimal minStake;

    @NotNull(message = "Maximum daily stake is required.")
    @DecimalMin(value = "10000.00", message = "Maximum daily stake must be at least 10,000 VND.")
    private BigDecimal maxDailyStake;

    @NotNull(message = "Operator fee rate is required.")
    @DecimalMin(value = "0.0000", message = "Operator fee rate cannot be negative.")
    @DecimalMax(value = "0.5000", message = "Operator fee rate cannot exceed 50%.")
    private BigDecimal operatorFeeRate;

    @NotNull(message = "Active status is required.")
    private Boolean active;
}
