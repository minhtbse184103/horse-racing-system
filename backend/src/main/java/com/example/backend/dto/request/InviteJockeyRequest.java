package com.example.backend.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteJockeyRequest {

    @NotNull(message = "Tournament id is required")
    private Integer tournamentId;

    @NotNull(message = "Horse id is required")
    private Integer horseId;

    @NotNull(message = "Jockey id is required")
    private Integer jockeyId;

    @Future(message = "Expired time must be in the future")
    private LocalDateTime expiredAt;

    private String message;
}
