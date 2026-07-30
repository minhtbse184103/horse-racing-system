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
        // FLOW: Admin Registration List / Load / Filter
        // ORDER: 3/8 - Backend controller receives main Registration list request and delegates status filtering to service.
        // API: GET /api/admin/registrations?status={status}.
        // Purpose: returns admin Registration DTOs for workspace review lists; UI scopes/filter rows by Tournament.
        return registrationService.getRegistrations(status);
    }

    @GetMapping("/pending")
    public List<RegistrationResponse> getPendingRegistrations() {
        // FLOW: Admin Registration List / Load / Filter
        // ORDER: 3ALT/8 - Backend controller receives pending-only queue request.
        // API: GET /api/admin/registrations/pending.
        // Purpose: returns the oldest-submitted PENDING registrations for review queue use.
        return registrationService.getPendingRegistrations();
    }

    @GetMapping("/history")
    public List<RegistrationResponse> getRegistrationHistory() {
        // FLOW: Admin Registration List / Load / Filter
        // ORDER: 3ALT/8 - Backend controller receives reviewed-history request.
        // API: GET /api/admin/registrations/history.
        // Purpose: returns reviewed Registration history after APPROVED/REJECTED/CANCELLED decisions.
        return registrationService.getRegistrationHistory();
    }

    @PutMapping("/{registrationId}/approve")
    public RegistrationResponse approveRegistration(
            @PathVariable Integer registrationId,
            Authentication authentication
    ) {
        // FLOW: Admin Approve Registration
        // ORDER: 6/8 - Backend controller receives approve request and passes authenticated admin email to service.
        // API: PUT /api/admin/registrations/{registrationId}/approve.
        // Purpose: approves a PENDING Registration after service-level eligibility checks.
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
        // FLOW: Admin Reject Registration
        // ORDER: 5/6 - Backend controller receives reject request body and delegates to AdminRegistrationService.
        // API: PUT /api/admin/registrations/{registrationId}/reject.
        // Purpose: rejects one PENDING Registration and stores the admin's rejection reason/audit fields.
        return registrationService.rejectRegistration(
                registrationId,
                request,
                authentication.getName()
        );
    }

    @PutMapping("/{registrationId}/payment-status")
    public RegistrationResponse updatePaymentStatus(
            @PathVariable Integer registrationId,
            @Valid @RequestBody UpdatePaymentStatusRequest request,
            Authentication authentication
    ) {
        return registrationService.updatePaymentStatus(
                registrationId,
                request,
                authentication.getName()
        );
    }

    @PutMapping("/{registrationId}/confirm-refund")
    public RegistrationResponse confirmManualRefund(
            @PathVariable Integer registrationId,
            Authentication authentication
    ) {
        return registrationService.confirmManualRefund(
                registrationId,
                authentication.getName()
        );
    }
}
