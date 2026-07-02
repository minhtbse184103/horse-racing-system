package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceResultSubmissionSummaryResponse {

    private Integer submissionId;
    private Integer raceId;
    private String raceName;
    private String trackName;
    private LocalDateTime raceStartTime;
    private LocalDateTime raceEndTime;
    private Integer tournamentId;
    private String status;
    private LocalDateTime submittedAt;
}
