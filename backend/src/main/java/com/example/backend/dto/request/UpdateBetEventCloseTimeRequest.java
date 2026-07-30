package com.example.backend.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateBetEventCloseTimeRequest {

    @NotNull(message = "Close time is required.")
    @Future(message = "Close time must be in the future.")
    private LocalDateTime closeAt;
}
