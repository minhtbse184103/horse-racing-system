package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminTournamentWorkspaceResponse {

    private Integer tournamentId;
    private String tournamentName;
    private String description;
    private String venue;
    private String venueImageUrl;

    private LocalDateTime registrationOpenAt;
    private LocalDateTime registrationCloseAt;

    private LocalDate startDate;
    private LocalDate endDate;

    private Integer maxRegistrations;
    private BigDecimal entryFee;
    private String status;

    private Integer createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private long raceCount;
    private long registrationCount;
    private long approvedRegistrationCount;

    private List<TournamentConditionResponse> conditions;
    private List<RaceResponse> races;
}
