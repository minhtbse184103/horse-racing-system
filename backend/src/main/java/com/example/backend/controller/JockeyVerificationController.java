package com.example.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.request.JockeyVerificationRequest;
import com.example.backend.dto.response.JockeyVerificationResponse;
import com.example.backend.service.JockeyVerificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/jockeys/verifications")
@RequiredArgsConstructor
@Tag(name = "Jockey Verification", description = "API cho nài ngựa gửi và quản lý hồ sơ xác minh")
public class JockeyVerificationController {

    private final JockeyVerificationService verificationService;

    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('JOCKEY', 'SPECTATOR')")
    @Operation(summary = "Gửi yêu cầu xác minh lần đầu")
    public ResponseEntity<ApiResponse<JockeyVerificationResponse>> submitVerification(
            @Valid @RequestBody JockeyVerificationRequest request) {
        return ResponseEntity.ok(verificationService.submitVerification(request));
    }

    @PutMapping("/{id}/resubmit")
    @PreAuthorize("hasAnyRole('JOCKEY', 'SPECTATOR')")
    @Operation(summary = "Gửi lại yêu cầu xác minh sau khi bị từ chối")
    public ResponseEntity<ApiResponse<JockeyVerificationResponse>> resubmitVerification(
            @PathVariable Integer id,
            @Valid @RequestBody JockeyVerificationRequest request) {
        return ResponseEntity.ok(verificationService.resubmitVerification(id, request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('JOCKEY', 'SPECTATOR')")
    @Operation(summary = "Xem trạng thái xác minh hiện tại")
    public ResponseEntity<ApiResponse<JockeyVerificationResponse>> getMyVerification() {
        return ResponseEntity.ok(verificationService.getMyVerification());
    }

    @GetMapping("/my/history")
    @PreAuthorize("hasAnyRole('JOCKEY', 'SPECTATOR')")
    @Operation(summary = "Xem lịch sử các yêu cầu xác minh")
    public ResponseEntity<ApiResponse<List<JockeyVerificationResponse>>> getMyVerificationHistory() {
        return ResponseEntity.ok(verificationService.getMyVerificationHistory());
    }
}
