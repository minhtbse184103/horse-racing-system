package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceResultIngestResponse {

    // FLOW: Race Status After Unity Finish
    // ORDER: 10/10 - Response carries PENDING_REVIEW/submission info back to Unity broadcast and admin live UI.
    // Returned to Unity/live broadcast so FE can leave live mode and show
    // PENDING_REVIEW while Referee/Admin review handles official completion.
    private Integer raceId;
    private Integer submissionId;
    private String status;
    private String reviewStatus;
    private LocalDateTime recordedAt;
}
