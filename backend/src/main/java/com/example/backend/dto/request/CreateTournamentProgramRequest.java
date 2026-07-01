package com.example.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class CreateTournamentProgramRequest {

    @NotNull(message = "Tournament is required.")
    @Valid
    private CreateTournamentRequest tournament;

    @NotEmpty(message = "At least one race is required.")
    @Valid
    private List<CreateTournamentProgramRaceRequest> races = new ArrayList<>();
}
