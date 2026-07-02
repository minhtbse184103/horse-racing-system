package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceResultIngestResponse {

    private Integer raceId;
    private Integer submissionId;
    private String status;
    private String reviewStatus;
    private LocalDateTime recordedAt;
}
