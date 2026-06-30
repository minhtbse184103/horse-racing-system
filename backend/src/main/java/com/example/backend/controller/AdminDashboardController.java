package com.example.backend.controller;

import com.example.backend.dto.response.AdminOverviewResponse;
import com.example.backend.dto.response.AdminDashboardSummaryResponse;
import com.example.backend.service.AdminDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {
    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/summary")
    public AdminDashboardSummaryResponse getSummary() {
        return adminDashboardService.getSummary();
    }

    @GetMapping("/overview")
    public AdminOverviewResponse getOverview() {
        return adminDashboardService.getOverview();
    }
}
