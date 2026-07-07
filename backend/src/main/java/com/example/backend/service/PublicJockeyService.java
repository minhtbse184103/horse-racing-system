package com.example.backend.service;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.response.PublicJockeyProfileResponse;

public interface PublicJockeyService {
    ApiResponse<PublicJockeyProfileResponse> getJockeyProfile(Integer jockeyId);
}
