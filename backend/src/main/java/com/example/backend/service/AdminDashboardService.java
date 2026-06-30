package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.dto.response.AdminOverviewResponse;
import com.example.backend.dto.response.AdminDashboardSummaryResponse;
import com.example.backend.repository.AdminDashboardRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminDashboardService {
    private final AdminDashboardRepository adminDashboardRepository;

    public AdminDashboardService(AdminDashboardRepository adminDashboardRepository) {
        this.adminDashboardRepository = adminDashboardRepository;
    }

    public AdminDashboardSummaryResponse getSummary() {
        return new AdminDashboardSummaryResponse(
                adminDashboardRepository.countUsers(),
                adminDashboardRepository.countUsersByRole("OWNER"),
                adminDashboardRepository.countUsersByRole("JOCKEY"),
                adminDashboardRepository.countHorses(),
                adminDashboardRepository.countTournaments(),
                adminDashboardRepository.countOpenRegistrationTournaments(),
                adminDashboardRepository.countCancelledTournaments(),
                adminDashboardRepository.countRaces(),
                adminDashboardRepository.countOpenRegistrationRaces(),
                adminDashboardRepository.countCancelledRaces()
        );
    }

    public AdminOverviewResponse getOverview() {
        return AdminOverviewResponse.builder()
                .totalUsers(adminDashboardRepository.countUsers())
                .activeUsers(adminDashboardRepository.countUsersByStatus("ACTIVE"))
                .totalTournaments(adminDashboardRepository.countTournaments())
                .openTournaments(adminDashboardRepository.countOpenRegistrationTournaments())
                .pendingRegistrations(adminDashboardRepository.countPendingRegistrations())
                .approvedRegistrations(adminDashboardRepository.countApprovedRegistrations())
                .pendingHorses(adminDashboardRepository.countPendingHorses())
                .jockeyReviewProfiles(adminDashboardRepository.countJockeyReviewProfiles())
                .pendingOwnerApplications(adminDashboardRepository.countPendingOwnerApplications())
                .raceEntryQueue(adminDashboardRepository.countRaceEntryAssignmentQueue())
                .refereeAssignments(adminDashboardRepository.countRefereeAssignments())
                .upcomingTournaments(
                        adminDashboardRepository.findUpcomingTournamentOverview(5)
                )
                .tournamentStatuses(
                        adminDashboardRepository.countTournamentsByStatuses(
                                List.of(
                                        EventStatus.OPEN_FOR_REGISTRATION,
                                        EventStatus.REGISTRATION_CLOSED,
                                        EventStatus.IN_PROGRESS,
                                        EventStatus.COMPLETED,
                                        EventStatus.CANCELLED
                                )
                        )
                )
                .build();
    }
}
