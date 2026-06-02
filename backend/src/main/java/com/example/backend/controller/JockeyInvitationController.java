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

import com.example.backend.dto.request.CreateInvitationRequest;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.JockeyInvitationService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/invitations")
@Tag(name = "Jockey Invitation Management", description = "APIs for sending and managing jockey invitations")
public class JockeyInvitationController {
    @Autowired
    private JockeyInvitationService jockeyInvitationService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Send invitation to jockey (Owner only)
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<JockeyInvitationResponse> sendInvitation(
            @Valid @RequestBody CreateInvitationRequest request,
            Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        JockeyInvitationResponse response = jockeyInvitationService.sendInvitation(owner, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get pending invitations for the current jockey
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('JOCKEY')")
    public ResponseEntity<List<JockeyInvitationResponse>> getMyInvitations(Principal principal) {
        User jockey = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<JockeyInvitationResponse> invitations = jockeyInvitationService.getJockeyInvitations(jockey);
        return ResponseEntity.ok(invitations);
    }

    /**
     * Accept an invitation (Jockey only)
     */
    @PostMapping("/{invitationID}/accept")
    @PreAuthorize("hasRole('JOCKEY')")
    public ResponseEntity<JockeyInvitationResponse> acceptInvitation(
            @PathVariable Integer invitationID,
            Principal principal) {
        User jockey = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        JockeyInvitationResponse response = jockeyInvitationService.acceptInvitation(jockey, invitationID);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject an invitation (Jockey only)
     */
    @PostMapping("/{invitationID}/reject")
    @PreAuthorize("hasRole('JOCKEY')")
    public ResponseEntity<JockeyInvitationResponse> rejectInvitation(
            @PathVariable Integer invitationID,
            Principal principal) {
        User jockey = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        JockeyInvitationResponse response = jockeyInvitationService.rejectInvitation(jockey, invitationID);
        return ResponseEntity.ok(response);
    }
}
