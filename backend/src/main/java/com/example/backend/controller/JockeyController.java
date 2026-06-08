package com.example.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.request.JockeyProfileRequest;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.service.JockeyService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/jockey")
@PreAuthorize("hasRole('JOCKEY')")
public class JockeyController {
    private final JockeyService jockeyService;

    public JockeyController(JockeyService jockeyService) {
        this.jockeyService = jockeyService;
    }

    @GetMapping("/profile")
    public JockeyProfileResponse getProfile() {
        return jockeyService.getProfile();
    }

    @PostMapping("/profile")
    public ResponseEntity<JockeyProfileResponse> createProfile(
            @Valid @RequestBody JockeyProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jockeyService.createProfile(request));
    }

    @PutMapping("/profile")
    public JockeyProfileResponse updateProfile(@Valid @RequestBody JockeyProfileRequest request) {
        return jockeyService.updateProfile(request);
    }

    @DeleteMapping("/profile")
    public ResponseEntity<Void> deleteProfile() {
        jockeyService.deleteProfile();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invitations")
    public List<JockeyInvitationResponse> getMyInvitations() {
        return jockeyService.getMyInvitations();
    }

    @PutMapping("/invitations/{invitationId}/accept")
    public JockeyInvitationResponse acceptInvitation(@PathVariable Integer invitationId) {
        return jockeyService.acceptInvitation(invitationId);
    }

    @PutMapping("/invitations/{invitationId}/reject")
    public JockeyInvitationResponse rejectInvitation(@PathVariable Integer invitationId) {
        return jockeyService.rejectInvitation(invitationId);
    }
}
