package com.example.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.request.CreateRegistrationRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.RegistrationService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/registrations")
@Tag(name = "Registration Management", description = "APIs for registering horses in races")
public class RegistrationController {
    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Register a horse for a race (Owner only)
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<RegistrationResponse> registerHorse(
            @Valid @RequestBody CreateRegistrationRequest request,
            Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        RegistrationResponse response = registrationService.registerHorse(owner, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get registrations by owner
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<RegistrationResponse>> getMyRegistrations(Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<RegistrationResponse> registrations = registrationService.getOwnerRegistrations(owner);
        return ResponseEntity.ok(registrations);
    }

    /**
     * Get all registrations for a race
     */
    @GetMapping("/race/{raceID}")
    public ResponseEntity<List<RegistrationResponse>> getRaceRegistrations(
            @PathVariable Integer raceID) {
        List<RegistrationResponse> registrations = registrationService.getRaceRegistrations(raceID);
        return ResponseEntity.ok(registrations);
    }

    /**
     * Approve a registration (Admin only)
     */
    @PostMapping("/{regID}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegistrationResponse> approveRegistration(
            @PathVariable Integer regID) {
        RegistrationResponse response = registrationService.approveRegistration(regID);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a registration (Admin only)
     */
    @PostMapping("/{regID}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RegistrationResponse> rejectRegistration(
            @PathVariable Integer regID) {
        RegistrationResponse response = registrationService.rejectRegistration(regID);
        return ResponseEntity.ok(response);
    }
}
