package com.example.backend.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JockeyVerificationFileResponse {
    private Integer fileId;
    private String fileUrl;
    private String fileType;
    private LocalDateTime uploadedAt;
}
