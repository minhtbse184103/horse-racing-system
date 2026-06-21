package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceEntryResponse {

    private Integer raceEntryId;

    private Integer raceId;
    private String raceName;
    private String trackName;

    private Integer tournamentId;
    private String tournamentName;

    private Integer registrationId;
    private String registrationNo;

    private Integer horseId;
    private String horseName;

    private Integer ownerId;
    private String ownerName;

    private Integer jockeyId;
    private String jockeyName;

    private Integer startingStall;
    private String status;

    private Integer assignedBy;
    private String assignedByName;
    private LocalDateTime assignedAt;
    private LocalDateTime cancelledAt;

    private Integer cancelledBy;

    private String cancellationReason;
}