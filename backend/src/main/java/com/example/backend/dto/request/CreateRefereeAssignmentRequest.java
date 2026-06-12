package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRefereeAssignmentRequest {

    @NotNull(message = "Race id is required")
    private Integer raceId;

    @NotNull(message = "Referee user id is required")
    private Integer refereeUserId;
}