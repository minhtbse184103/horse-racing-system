package com.example.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.request.InviteJockeyRequest;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.service.OwnerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/owner/invitations")
@PreAuthorize("hasRole('OWNER')")
public class OwnerInvitationController {
    private final OwnerService ownerService;

    public OwnerInvitationController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    // Lấy danh sách lời mời jockey mà owner đã gửi.
    @GetMapping
    public List<JockeyInvitationResponse> getMyInvitations() {
        return ownerService.getMyInvitations();
    }

    // Gửi lời mời jockey tham gia tournament cùng một ngựa của owner.
    @PostMapping
    public ResponseEntity<JockeyInvitationResponse> inviteJockey(
            @Valid @RequestBody InviteJockeyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ownerService.inviteJockey(request));
    }

    // Hủy lời mời jockey đang ở trạng thái PENDING.
    @PutMapping("/{invitationId}/cancel")
    public JockeyInvitationResponse cancelInvitation(@PathVariable Integer invitationId) {
        return ownerService.cancelInvitation(invitationId);
    }
}
