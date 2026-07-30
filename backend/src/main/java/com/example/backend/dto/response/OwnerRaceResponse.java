package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class OwnerRaceResponse {

    private Integer raceEntryId;
    private Integer raceId;
    private Integer tournamentId;
    private String tournamentName;
    private String raceName;
    private String trackName;
    private String trackImageUrl;
    private LocalDateTime raceStartTime;
    private LocalDateTime raceEndTime;
    private Integer distance;
    private Integer maxRunners;
    private Integer raceOrder;
    private String raceStatus;
    private Integer startingStall;
    private String raceEntryStatus;
    private Integer registrationId;
    private String registrationNo;
    private Integer horseId;
    private String horseName;
    private Integer jockeyId;
    private String jockeyName;
    private boolean officialResultAvailable;
    private Integer finishPosition;
}
