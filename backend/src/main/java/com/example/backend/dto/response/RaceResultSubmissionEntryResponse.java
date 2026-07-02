package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RaceResultSubmissionEntryResponse {

    private Integer submissionEntryId;
    private Integer raceEntryId;
    private Integer startingStall;
    private Integer finishPosition;
    private String finishTime;
    private Integer points;
}
