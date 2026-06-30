package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RaceResultEntryRequest {

    @NotNull(message = "Starting stall is required.")
    private Integer startingStall;

    @NotNull(message = "Finish position is required.")
    @Min(value = 1, message = "Finish position must be at least 1.")
    private Integer finishPosition;

    @NotBlank(message = "Finish time is required.")
    private String finishTime;
}
