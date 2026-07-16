package com.example.backend.controller;

import com.example.backend.dto.response.AdminFinanceOverviewResponse;
import com.example.backend.service.AdminFinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
public class AdminFinanceController {

    private final AdminFinanceService financeService;

    @GetMapping("/overview")
    public AdminFinanceOverviewResponse getOverview() {
        return financeService.getOverview();
    }

    @PostMapping("/prize-distributions/{distributionId}/retry")
    public AdminFinanceOverviewResponse.PrizeDistributionItem retryPrize(
            @PathVariable Integer distributionId
    ) {
        return financeService.retryPrize(distributionId);
    }
}
