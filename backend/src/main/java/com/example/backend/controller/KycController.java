package com.example.backend.controller;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.response.KycResponseDTO;
import com.example.backend.dto.response.KycSessionResponse;
import com.example.backend.service.KycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class KycController {
    private final KycService kycService;

    @PostMapping("/api/kyc/session")
    @PreAuthorize("hasRole('SPECTATOR')")
    public ResponseEntity<ApiResponse<KycSessionResponse>> createSession(Authentication authentication) {
        return ResponseEntity.status(201).body(ApiResponse.<KycSessionResponse>builder().status(true)
                .message("KYC session is ready.").data(kycService.createSession(authentication.getName())).build());
    }

    @GetMapping("/api/kyc/me")
    @PreAuthorize("hasRole('SPECTATOR')")
    public ResponseEntity<ApiResponse<KycResponseDTO>> getMine(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.<KycResponseDTO>builder().status(true)
                .message("KYC status retrieved.").data(kycService.getMine(authentication.getName())).build());
    }

    @PostMapping("/api/webhooks/didit")
    public ResponseEntity<ApiResponse<Void>> webhook(
            @RequestBody byte[] body,
            @RequestHeader(value = "X-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "X-Signature-V2", required = false) String signatureV2,
            @RequestHeader(value = "X-Signature", required = false) String signature,
            @RequestHeader(value = "X-Signature-Simple", required = false) String simpleSignature,
            @RequestHeader(value = "X-Didit-Test-Webhook", required = false) String testWebhook) {
        kycService.processWebhook(body, timestamp, signatureV2, signature, simpleSignature,
                Boolean.parseBoolean(testWebhook));
        return ResponseEntity.ok(ApiResponse.<Void>builder().status(true).message("Webhook accepted.").build());
    }
}
