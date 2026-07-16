package com.example.backend.service;

import com.example.backend.dto.response.KycResponseDTO;
import com.example.backend.dto.response.KycSessionResponse;

public interface KycService {
    KycSessionResponse createSession(String email);
    KycResponseDTO getMine(String email);
    void processWebhook(byte[] body, String timestamp, String signatureV2,
                        String rawSignature, String simpleSignature, boolean testWebhook);
}
