package com.example.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.request.AdminReviewRequestDTO;
import com.example.backend.dto.response.JockeyVerificationResponse;
import com.example.backend.service.JockeyVerificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/jockeys/verifications")
@RequiredArgsConstructor
@Tag(name = "Admin Jockey Verification", description = "API cho quản trị viên xét duyệt hồ sơ nài ngựa")
public class AdminJockeyVerificationController {

    private final JockeyVerificationService verificationService;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy danh sách yêu cầu xác minh đang chờ duyệt")
    public ResponseEntity<ApiResponse<List<JockeyVerificationResponse>>> getPendingVerifications() {
        return ResponseEntity.ok(verificationService.getPendingVerifications());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xem chi tiết một yêu cầu xác minh")
    public ResponseEntity<ApiResponse<JockeyVerificationResponse>> getVerificationById(@PathVariable Integer id) {
        return ResponseEntity.ok(verificationService.getVerificationById(id));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Phê duyệt hoặc từ chối yêu cầu xác minh")
    public ResponseEntity<ApiResponse<JockeyVerificationResponse>> reviewVerification(
            @PathVariable Integer id,
            @Valid @RequestBody AdminReviewRequestDTO reviewRequest) {
        
        if ("APPROVED".equalsIgnoreCase(reviewRequest.getStatus())) {
            return ResponseEntity.ok(verificationService.approveVerification(id));
        } else {
            return ResponseEntity.ok(verificationService.rejectVerification(id, reviewRequest.getRejectionReason()));
        }
    }
}
