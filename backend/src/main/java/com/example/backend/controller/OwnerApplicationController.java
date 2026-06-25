package com.example.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.request.AdminReviewFeedbackRequest;
import com.example.backend.dto.request.OwnerApplicationRequest;
import com.example.backend.dto.response.OwnerApplicationResponse;
import com.example.backend.dto.response.OwnerProfileResponse;
import com.example.backend.service.OwnerApplicationService;

import jakarta.validation.Valid;

@RestController
public class OwnerApplicationController {
    private final OwnerApplicationService ownerApplicationService;

    public OwnerApplicationController(OwnerApplicationService ownerApplicationService) {
        this.ownerApplicationService = ownerApplicationService;
    }

    @PostMapping(value = "/api/owner-applications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SPECTATOR')")
    public ResponseEntity<OwnerApplicationResponse> submitMyApplication(
            @Valid @ModelAttribute OwnerApplicationRequest request) {
        return ResponseEntity.ok(ownerApplicationService.submitMyApplication(request));
    }

    @GetMapping("/api/owner-applications/me")
    public ResponseEntity<OwnerApplicationResponse> getMyApplication() {
        return ResponseEntity.ok(ownerApplicationService.getMyApplication());
    }

    @GetMapping("/api/owner-applications/{applicationId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OwnerApplicationResponse> getMyApplication(@PathVariable Integer applicationId) {
        return ResponseEntity.ok(ownerApplicationService.getMyApplication(applicationId));
    }

    @GetMapping("/api/owner/profile")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<OwnerProfileResponse> getMyOwnerProfile() {
        return ResponseEntity.ok(ownerApplicationService.getMyOwnerProfile());
    }

    @GetMapping("/api/admin/owner-applications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OwnerApplicationResponse>> getOwnerApplications(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ownerApplicationService.getApplicationsByStatus(status));
    }

    @GetMapping("/api/admin/owner-applications/{applicationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnerApplicationResponse> getOwnerApplication(@PathVariable Integer applicationId) {
        return ResponseEntity.ok(ownerApplicationService.getAdminApplication(applicationId));
    }

    @PutMapping("/api/admin/owner-applications/{applicationId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnerApplicationResponse> approveOwnerApplication(@PathVariable Integer applicationId) {
        return ResponseEntity.ok(ownerApplicationService.approveApplication(applicationId));
    }

    @PutMapping("/api/admin/owner-applications/{applicationId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OwnerApplicationResponse> rejectOwnerApplication(
            @PathVariable Integer applicationId,
            @Valid @RequestBody AdminReviewFeedbackRequest request) {
        return ResponseEntity.ok(ownerApplicationService.rejectApplication(applicationId, request.getFeedback()));
    }
}
