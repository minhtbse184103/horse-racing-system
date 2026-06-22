package com.example.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TournamentConditionRequest {

    @NotBlank(message = "Condition type is required.")
    @Pattern(
            regexp = "AGE|GENDER|WEIGHT",
            message = "Condition type must be AGE, GENDER, or WEIGHT."
    )
    private String conditionType;

    @NotBlank(message = "Condition operator is required.")
    @Pattern(
            regexp = "EQ|GT|GTE|LT|LTE|BETWEEN",
            message = "Unsupported condition operator."
    )
    private String operator;

    @Size(max = 50, message = "Condition value must not exceed 50 characters.")
    private String value;

    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Minimum value cannot be negative."
    )
    private BigDecimal minValue;

    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Maximum value cannot be negative."
    )
    private BigDecimal maxValue;
}