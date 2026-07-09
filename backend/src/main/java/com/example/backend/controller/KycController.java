package com.example.backend.controller;

import com.example.backend.dto.request.AdminReviewFeedbackRequest;
import com.example.backend.dto.request.KycSubmissionRequestDTO;
import com.example.backend.dto.response.KycResponseDTO;
import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.service.KycService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "KYC", description = "API xác minh danh tính người dùng")
public class KycController {
    private final KycService kycService;

    @PostMapping(value = "/kyc/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'SPECTATOR', 'JOCKEY')")
    @Operation(summary = "Gửi hồ sơ KYC")
    public ResponseEntity<ApiResponse<KycResponseDTO>> submit(
            Authentication authentication,
            @Valid @ModelAttribute KycSubmissionRequestDTO request
    ) {
        return ResponseEntity.status(201).body(ApiResponse.<KycResponseDTO>builder()
                .status(true).message("Gửi hồ sơ KYC thành công.")
                .data(kycService.submit(authentication.getName(), request)).build());
    }

    @GetMapping("/kyc/me")
    @PreAuthorize("hasAnyRole('OWNER', 'SPECTATOR', 'JOCKEY')")
    @Operation(summary = "Xem hồ sơ KYC của tôi")
    public ResponseEntity<ApiResponse<KycResponseDTO>> getMine(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.<KycResponseDTO>builder().status(true)
                .message("Lấy hồ sơ KYC thành công.")
                .data(kycService.getMine(authentication.getName())).build());
    }

    @GetMapping("/admin/kyc")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Danh sách hồ sơ KYC")
    public ResponseEntity<ApiResponse<List<KycResponseDTO>>> getAll(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(ApiResponse.<List<KycResponseDTO>>builder().status(true)
                .message("Lấy danh sách KYC thành công.")
                .data(kycService.getForAdmin(status)).build());
    }

    @GetMapping("/admin/kyc/{verificationId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xem chi tiết hồ sơ KYC")
    public ResponseEntity<ApiResponse<KycResponseDTO>> getOne(
            @PathVariable Integer verificationId
    ) {
        return ResponseEntity.ok(ApiResponse.<KycResponseDTO>builder().status(true)
                .message("Lấy chi tiết KYC thành công.")
                .data(kycService.getForAdmin(verificationId)).build());
    }

    @PutMapping("/admin/kyc/{verificationId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Duyệt hồ sơ KYC và mở ví")
    public ResponseEntity<ApiResponse<KycResponseDTO>> approve(
            @PathVariable Integer verificationId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.<KycResponseDTO>builder().status(true)
                .message("Duyệt KYC và mở ví thành công.")
                .data(kycService.approve(verificationId, authentication.getName())).build());
    }

    @PutMapping("/admin/kyc/{verificationId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Từ chối hồ sơ KYC")
    public ResponseEntity<ApiResponse<KycResponseDTO>> reject(
            @PathVariable Integer verificationId,
            @Valid @RequestBody AdminReviewFeedbackRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ApiResponse.<KycResponseDTO>builder().status(true)
                .message("Từ chối hồ sơ KYC thành công.")
                .data(kycService.reject(verificationId, request.getFeedback(),
                        authentication.getName())).build());
    }
}
