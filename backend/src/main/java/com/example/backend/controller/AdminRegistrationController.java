package com.example.backend.controller;

import com.example.backend.dto.request.RejectRegistrationRequest;
import com.example.backend.dto.request.UpdatePaymentStatusRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.service.AdminRegistrationService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/registrations")
public class AdminRegistrationController {

    private final AdminRegistrationService registrationService;

    public AdminRegistrationController(
            AdminRegistrationService registrationService
    ) {
        this.registrationService = registrationService;
    }

    @GetMapping
    public List<RegistrationResponse> getRegistrations(
            @RequestParam(required = false) String status
    ) {
        return registrationService.getRegistrations(status);
    }

    @GetMapping("/pending")
    public List<RegistrationResponse> getPendingRegistrations() {
        return registrationService.getPendingRegistrations();
    }

    @GetMapping("/history")
    public List<RegistrationResponse> getRegistrationHistory() {
        return registrationService.getRegistrationHistory();
    }

    @PutMapping("/{registrationId}/approve")
    public RegistrationResponse approveRegistration(
            @PathVariable Integer registrationId,
            Authentication authentication
    ) {
        return registrationService.approveRegistration(
                registrationId,
                authentication.getName()
        );
    }

    @PutMapping("/{registrationId}/reject")
    public RegistrationResponse rejectRegistration(
            @PathVariable Integer registrationId,
            @Valid @RequestBody RejectRegistrationRequest request,
            Authentication authentication
    ) {
        return registrationService.rejectRegistration(
                registrationId,
                request,
                authentication.getName()
        );
    }

    @PutMapping("/{registrationId}/payment-status")
    public RegistrationResponse updatePaymentStatus(
            @PathVariable Integer registrationId,
            @Valid @RequestBody UpdatePaymentStatusRequest request
    ) {
        return registrationService.updatePaymentStatus(
                registrationId,
                request
        );
    }
}