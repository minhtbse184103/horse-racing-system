package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class RaceResultSubmissionDetailResponse {

    private Integer submissionId;
    private Integer raceId;
    private String raceName;
    private String trackName;
    private LocalDateTime raceStartTime;
    private LocalDateTime raceEndTime;
    private Integer tournamentId;
    private String status;
    private LocalDateTime submittedAt;
    private Integer submittedBy;
    private LocalDateTime refereeReviewedAt;
    private Integer refereeReviewedBy;
    private String refereeComment;
    private LocalDateTime adminReviewedAt;
    private Integer adminReviewedBy;
    private String adminComment;
    private List<RaceResultSubmissionEntryResponse> entries;
    private List<RaceResultReviewActionResponse> reviewActions;
}
