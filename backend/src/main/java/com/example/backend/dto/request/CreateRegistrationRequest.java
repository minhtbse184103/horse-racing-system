package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRegistrationRequest {
    @NotNull(message = "Race ID is required")
    @Positive(message = "Race ID must be positive")
    private Integer raceID;

    @NotNull(message = "Horse ID is required")
    @Positive(message = "Horse ID must be positive")
    private Integer horseID;
}
