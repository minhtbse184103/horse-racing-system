package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminDashboardSummaryResponse {
    private long totalUsers;
    private long totalOwners;
    private long totalJockeys;
    private long totalHorses;

    private long totalTournaments;
    private long openRegistrationTournaments;
    private long cancelledTournaments;

    private long totalRaces;
    private long openRegistrationRaces;
    private long cancelledRaces;
}
