package com.example.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RaceResultIngestRequest {

    // FLOW: Unity Result Endpoint
    // ORDER: 1/10 - Request wrapper defines the final Unity result payload before controller/service validation.
    // Unity must submit one validated row per ASSIGNED RaceEntry; service
    // later verifies the count, stalls, and positions against database state.
    @NotEmpty(message = "Results must contain at least one entry.")
    @Valid
    private List<RaceResultEntryRequest> entries;
}
