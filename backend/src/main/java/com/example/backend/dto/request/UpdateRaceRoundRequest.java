package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class UpdateRaceRoundRequest {

    @NotNull(message = "Round number is required")
    @Positive(message = "Round number must greater than 0")
    private Integer roundNumber;

    @NotNull(message = "Distance is required")
    @Positive(message = "Distance must greater than 0")
    private Integer distance;

    @NotNull(message = "Distance co-efficient is required")
    @Positive(message = "Distance co-efficient must be a positive number")
    private BigDecimal distanceCoefficient;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledTime;

    public Integer getRoundNumber() {
        return roundNumber;
    }

    public Integer getDistance() {
        return distance;
    }

    public BigDecimal getDistanceCoefficient() {
        return distanceCoefficient;
    }

    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }
}