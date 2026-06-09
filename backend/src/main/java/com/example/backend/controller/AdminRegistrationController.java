package com.example.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.AdminRegistrationResponse;
import com.example.backend.service.AdminRegistrationService;

@RestController
@RequestMapping("/api/admin/registrations")
public class AdminRegistrationController {

    private final AdminRegistrationService adminRegistrationService;

    public AdminRegistrationController(
            AdminRegistrationService adminRegistrationService) {
        this.adminRegistrationService = adminRegistrationService;
    }

    @GetMapping("/accepted")
    public List<AdminRegistrationResponse> getAcceptedRegistrations() {
        return adminRegistrationService.getAcceptedRegistrations();
    }

    @PutMapping("/{registrationId}/confirm")
    public AdminRegistrationResponse confirmRegistration(
            @PathVariable Integer registrationId) {
        return adminRegistrationService.confirmRegistration(registrationId);
    }

    @PutMapping("/{registrationId}/reject")
    public AdminRegistrationResponse rejectRegistration(
            @PathVariable Integer registrationId) {
        return adminRegistrationService.rejectRegistration(registrationId);
    }
}