package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RaceEntryCandidateResponse {
    private Integer registrationId;

    private Integer tournamentId;
    private String tournamentName;

    private Integer roundId;
    private String roundName;

    private Integer horseId;
    private String horseName;

    private Integer ownerId;
    private String ownerName;

    private Integer jockeyId;
    private String jockeyName;

    private String registrationStatus;
}