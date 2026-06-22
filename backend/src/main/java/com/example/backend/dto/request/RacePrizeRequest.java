package com.example.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RacePrizeRequest {

    @NotNull(message = "Prize rank is required.")
    @Min(value = 1, message = "Prize rank must be greater than zero.")
    private Integer rankPosition;

    @NotNull(message = "Prize amount is required.")
    @DecimalMin(
            value = "0.01",
            message = "Prize amount must be greater than zero."
    )
    private BigDecimal amount;

    @NotNull(message = "Owner prize percentage is required.")
    @DecimalMin(value = "0.0", message = "Owner prize percentage cannot be negative.")
    private BigDecimal ownerPercent;

    @NotNull(message = "Jockey prize percentage is required.")
    @DecimalMin(value = "0.0", message = "Jockey prize percentage cannot be negative.")
    private BigDecimal jockeyPercent;
}
