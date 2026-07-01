package com.example.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class UpdateTournamentRequest {

    @NotBlank(message = "Tournament name is required.")
    @Size(max = 255, message = "Tournament name must not exceed 255 characters.")
    private String tournamentName;

    @Size(max = 5000, message = "Description is too long.")
    private String description;

    @NotBlank(message = "Venue is required.")
    @Size(max = 255, message = "Venue must not exceed 255 characters.")
    private String venue;

    @NotNull(message = "Registration opening time is required.")
    private LocalDateTime registrationOpenAt;

    @NotNull(message = "Registration closing time is required.")
    private LocalDateTime registrationCloseAt;

    @NotNull(message = "Tournament start date is required.")
    private LocalDate startDate;

    @NotNull(message = "Tournament end date is required.")
    private LocalDate endDate;

    @NotNull(message = "Maximum registrations is required.")
    @Min(value = 3, message = "Maximum registrations must be at least 3.")
    private Integer maxRegistrations;

    @NotNull(message = "Entry fee is required.")
    @DecimalMin(
            value = "0.0",
            inclusive = true,
            message = "Entry fee cannot be negative."
    )
    private BigDecimal entryFee;

    @NotNull(message = "Tournament conditions cannot be null.")
    @Valid
    private List<TournamentConditionRequest> conditions = new ArrayList<>();
}
