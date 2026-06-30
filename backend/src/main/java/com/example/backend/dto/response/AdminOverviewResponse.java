package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class AdminOverviewResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalTournaments;
    private long openTournaments;
    private long pendingRegistrations;
    private long approvedRegistrations;
    private long pendingHorses;
    private long jockeyReviewProfiles;
    private long pendingOwnerApplications;
    private long raceEntryQueue;
    private long refereeAssignments;
    private List<TournamentOverviewItem> upcomingTournaments;
    private List<TournamentStatusCount> tournamentStatuses;

    @Getter
    @Builder
    public static class TournamentOverviewItem {
        private Integer tournamentId;
        private String tournamentName;
        private String venue;
        private LocalDate startDate;
        private String status;
    }

    @Getter
    @Builder
    public static class TournamentStatusCount {
        private String status;
        private long count;
    }
}
