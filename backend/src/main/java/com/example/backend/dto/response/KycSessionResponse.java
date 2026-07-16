package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KycSessionResponse {
    private Integer verificationId;
    private String status;
    private String verificationUrl;
    private boolean reused;
}
