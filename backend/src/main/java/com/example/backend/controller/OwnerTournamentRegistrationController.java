package com.example.backend.controller;

import com.example.backend.dto.request.OwnerTournamentRegistrationRequest;
import com.example.backend.dto.response.OwnerRegistrationPaymentResponse;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.dto.response.TournamentResponse;
import com.example.backend.service.OwnerTournamentRegistrationService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner/tournament-registrations")
@PreAuthorize("hasRole('OWNER')")
public class OwnerTournamentRegistrationController {

    private final OwnerTournamentRegistrationService registrationService;

    public OwnerTournamentRegistrationController(
            OwnerTournamentRegistrationService registrationService
    ) {
        this.registrationService = registrationService;
    }

    @GetMapping("/open-tournaments")
    public List<TournamentResponse> getOpenTournaments() {
        return registrationService.getOpenTournaments();
    }

    @PostMapping
    public ResponseEntity<OwnerRegistrationPaymentResponse> submitRegistration(
            @Valid @RequestBody OwnerTournamentRegistrationRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(registrationService.submitRegistration(
                        request,
                        getClientIp(httpRequest)
                ));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
