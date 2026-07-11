package com.example.backend.service;

import com.example.backend.dto.request.KycSubmissionRequestDTO;
import com.example.backend.dto.response.KycResponseDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface KycService {
    KycResponseDTO submit(String email, KycSubmissionRequestDTO request);

    KycResponseDTO getMine(String email);

    List<KycResponseDTO> getForAdmin(String status);

    KycResponseDTO getForAdmin(Integer verificationId);

    KycResponseDTO approve(Integer verificationId, String adminEmail);

    void approveUserKycAndOpenWallet(
            Integer userId,
            Integer adminId,
            Boolean confirmKycReviewed,
            LocalDateTime requestedExpiresAt
    );

    KycResponseDTO reject(Integer verificationId, String reason, String adminEmail);
}
