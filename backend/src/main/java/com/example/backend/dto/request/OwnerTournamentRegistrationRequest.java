package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OwnerTournamentRegistrationRequest {

    @NotNull(message = "Tournament ID is required.")
    private Integer tournamentId;

    @NotNull(message = "Horse ID is required.")
    private Integer horseId;

    @NotNull(message = "Jockey ID is required.")
    private Integer jockeyId;
}
