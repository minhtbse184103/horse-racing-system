package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CancelRaceEntryRequest {

    @NotBlank(message = "Cancellation reason is required.")
    @Size(max = 500, message = "Cancellation reason must not exceed 500 characters.")
    private String cancellationReason;
}