package com.example.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class UpdateRaceRequest {

    @NotBlank(message = "Race name is required.")
    @Size(max = 255, message = "Race name must not exceed 255 characters.")
    private String raceName;

    @NotBlank(message = "Track name is required.")
    @Size(max = 255, message = "Track name must not exceed 255 characters.")
    private String trackName;

    @NotNull(message = "Race start time is required.")
    private LocalDateTime raceStartTime;

    @NotNull(message = "Race end time is required.")
    private LocalDateTime raceEndTime;

    @NotNull(message = "Race distance is required.")
    @Min(value = 1, message = "Race distance must be greater than zero.")
    private Integer distance;

    @NotNull(message = "Maximum runners is required.")
    @Min(value = 3, message = "Maximum runners must be at least 3.")
    @Max(value = 6, message = "Maximum runners cannot exceed 6 for the Unity race simulator.")
    private Integer maxRunners;

    @Min(value = 1, message = "Race order must be greater than zero.")
    private Integer raceOrder;

    @NotNull(message = "Race prizes cannot be null.")
    @Valid
    private List<RacePrizeRequest> prizes = new ArrayList<>();
}
