package com.example.backend.controller;

import com.example.backend.dto.request.OwnerTournamentRegistrationRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.dto.response.TournamentResponse;
import com.example.backend.service.OwnerTournamentRegistrationService;
import jakarta.validation.Valid;
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
    public ResponseEntity<RegistrationResponse> submitRegistration(
            @Valid @RequestBody OwnerTournamentRegistrationRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(registrationService.submitRegistration(request));
    }
}
