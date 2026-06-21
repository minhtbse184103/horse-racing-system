package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRaceEntryRequest {

    @NotNull(message = "Race ID is required.")
    private Integer raceId;

    @NotNull(message = "Registration ID is required.")
    private Integer registrationId;
}