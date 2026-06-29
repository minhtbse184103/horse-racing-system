package com.example.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RaceResultIngestRequest {

    @NotEmpty(message = "Results must contain at least one entry.")
    @Valid
    private List<RaceResultEntryRequest> entries;
}
