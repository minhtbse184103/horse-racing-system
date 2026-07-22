package com.example.backend.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.dto.response.JockeyRaceResponse;
import com.example.backend.service.JockeyService;

@RestController
@RequestMapping("/api/admin/jockeys")
@PreAuthorize("hasRole('ADMIN')")
public class AdminJockeyProfileController {
    private final JockeyService jockeyService;

    public AdminJockeyProfileController(JockeyService jockeyService) {
        this.jockeyService = jockeyService;
    }

    @GetMapping("/{jockeyId}/profile")
    public JockeyProfileResponse getAdminJockeyProfile(@PathVariable Integer jockeyId) {
        // FLOW: Admin Registration Entity Detail Popup
        // ORDER: 4JOCKEY/6 - Controller receives the Jockey detail lookup and delegates to JockeyService.
        // API: GET /api/admin/jockeys/{jockeyId}/profile.
        // Purpose: returns Jockey profile/licence details when Admin clicks a Jockey inside Registration review.
        return jockeyService.getAdminProfile(jockeyId);
    }

    @GetMapping("/{jockeyId}/completed-races")
    public List<JockeyRaceResponse> getAdminJockeyCompletedRaces(@PathVariable Integer jockeyId) {
        return jockeyService.getAdminCompletedRaces(jockeyId);
    }
}
