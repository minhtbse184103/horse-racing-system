package com.example.backend.controller;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.response.HorsePerformanceResponse;
import com.example.backend.dto.response.JockeyPerformanceResponse;
import com.example.backend.service.PublicPerformanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicPerformanceController {
    private final PublicPerformanceService publicPerformanceService;

    public PublicPerformanceController(PublicPerformanceService publicPerformanceService) {
        this.publicPerformanceService = publicPerformanceService;
    }

    @GetMapping("/horses/{horseId}/performance")
    public ResponseEntity<ApiResponse<HorsePerformanceResponse>> getHorsePerformance(
            @PathVariable Integer horseId
    ) {
        return ResponseEntity.ok(publicPerformanceService.getHorsePerformance(horseId));
    }

    @GetMapping("/jockeys/{jockeyId}/performance")
    public ResponseEntity<ApiResponse<JockeyPerformanceResponse>> getJockeyPerformance(
            @PathVariable Integer jockeyId
    ) {
        return ResponseEntity.ok(publicPerformanceService.getJockeyPerformance(jockeyId));
    }
}
