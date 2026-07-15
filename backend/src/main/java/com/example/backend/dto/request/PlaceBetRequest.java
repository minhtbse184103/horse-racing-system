package com.example.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PlaceBetRequest {

    @NotNull(message = "Race entry ID is required.")
    private Integer raceEntryId;

    @NotNull(message = "Stake is required.")
    @DecimalMin(value = "10000.00", message = "Stake must be at least 10,000 VND.")
    private BigDecimal stake;
}
