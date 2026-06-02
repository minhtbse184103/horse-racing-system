package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvitationRequest {
    @NotNull(message = "Registration ID is required")
    @Positive(message = "Registration ID must be positive")
    private Integer registrationID;

    @NotNull(message = "Jockey ID is required")
    @Positive(message = "Jockey ID must be positive")
    private Integer jockeyID;
}
