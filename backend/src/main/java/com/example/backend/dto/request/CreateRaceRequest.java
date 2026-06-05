package com.example.backend.dto.request;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CreateRaceRequest {
@NotNull(message = "Tournament is required")
    private Integer tournamentId;
    @NotNull(message = "Race Category is required")
    private Integer categoryId;
    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledTime;
    @NotNull(message = "Max participants is required")
    @Positive(message = "Max participants must be a positive number")
    private Integer maxParticipants;
    @NotNull(message = "Lane count is required")
    @Positive(message = "Lane count must be a positive number")
    private Integer laneCount;

    @NotNull(message = "Prize pool is required")
    @PositiveOrZero(message = "Prize pool must be a positive number")
    private BigDecimal prizePool;

    public Integer getTournamentId() {
        return tournamentId;
    }

    public Integer getCategoryId() {
        return categoryId;
    }



    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public Integer getLaneCount() {
        return laneCount;
    }

    public LocalDateTime getScheduledTime() {
        return scheduledTime;
    }
    public BigDecimal getPrizePool() {
        return prizePool;
    }
}