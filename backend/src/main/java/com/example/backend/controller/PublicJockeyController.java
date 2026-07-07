package com.example.backend.controller;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.response.PublicJockeyProfileResponse;
import com.example.backend.service.PublicJockeyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/jockeys")
public class PublicJockeyController {
    private final PublicJockeyService publicJockeyService;

    public PublicJockeyController(PublicJockeyService publicJockeyService) {
        this.publicJockeyService = publicJockeyService;
    }

    @GetMapping("/{jockeyId}")
    public ResponseEntity<ApiResponse<PublicJockeyProfileResponse>> getJockeyProfile(
            @PathVariable Integer jockeyId
    ) {
        return ResponseEntity.ok(publicJockeyService.getJockeyProfile(jockeyId));
    }
}
