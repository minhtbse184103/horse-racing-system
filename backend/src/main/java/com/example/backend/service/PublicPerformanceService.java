package com.example.backend.service;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.response.HorsePerformanceResponse;
import com.example.backend.dto.response.JockeyPerformanceResponse;

public interface PublicPerformanceService {
    ApiResponse<HorsePerformanceResponse> getHorsePerformance(Integer horseId);

    ApiResponse<JockeyPerformanceResponse> getJockeyPerformance(Integer jockeyId);
}
