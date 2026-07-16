package com.example.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.JockeyProfileResponse;
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
        return jockeyService.getAdminProfile(jockeyId);
    }
}
