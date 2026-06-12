package com.example.backend.dto.request;

import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;

public class CreateTournamentRequest {
    
    @NotBlank(message = "Tournament name is required")
    private String tournamentName;
    @NotBlank(message = "Location is required")
    private String location;
    @NotNull(message = "Start date is required")
    @Future(message = "Start date must be after today")
    private LocalDate startDate;
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    @NotNull(message = "Registration deadline is required")
    private LocalDate registrationDeadline;
    @NotNull(message = "Minimum participants is required")
    @Min(value = 3, message = "Minimum participants must be greater than 2")
    private Integer minParticipants;

    @NotNull(message = "Maximum participants is required")
    @Positive(message = "Maximum participants must be positive")
    private Integer maxParticipants;

    @NotNull(message = "Tournament condition is required")
    private Integer conditionId;
    
    public String getTournamentName() {
        return tournamentName;
    }

    public String getLocation() {
        return location;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public LocalDate getRegistrationDeadline() {
        return registrationDeadline;
    }
    public Integer getMinParticipants() {
        return minParticipants;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public Integer getConditionId() {
        return conditionId;
    }

}
