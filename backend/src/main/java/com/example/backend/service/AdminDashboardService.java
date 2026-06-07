package com.example.backend.service;

import com.example.backend.dto.response.AdminDashboardSummaryResponse;
import com.example.backend.repository.AdminDashboardRepository;
import org.springframework.stereotype.Service;

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
                adminDashboardRepository.countDraftTournaments(),
                adminDashboardRepository.countCancelledTournaments(),
                adminDashboardRepository.countRaces(),
                adminDashboardRepository.countDraftRaces(),
                adminDashboardRepository.countCancelledRaces()
        );
    }
}