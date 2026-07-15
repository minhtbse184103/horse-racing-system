package com.example.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class CreateBetEventRequest {

    @NotNull(message = "Race ID is required.")
    private Integer raceId;

    @NotNull(message = "Bet product ID is required.")
    private Integer betProductId;

    @NotNull(message = "Open time is required.")
    @FutureOrPresent(message = "Open time cannot be in the past.")
    private LocalDateTime openAt;

    @NotNull(message = "Close time is required.")
    @Future(message = "Close time must be in the future.")
    private LocalDateTime closeAt;

    @DecimalMin(value = "0.0000", message = "Operator fee rate cannot be negative.")
    @DecimalMax(value = "0.5000", message = "Operator fee rate cannot exceed 50%.")
    private BigDecimal operatorFeeRate;
}
