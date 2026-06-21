package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceEntryCandidateResponse {

    private Integer registrationId;
    private String registrationNo;

    private Integer tournamentId;
    private String tournamentName;

    private Integer horseId;
    private String horseName;

    private Integer ownerId;
    private String ownerName;

    private Integer jockeyId;
    private String jockeyName;

    private String paymentStatus;
    private String approvalStatus;
    private LocalDateTime approvedAt;
}