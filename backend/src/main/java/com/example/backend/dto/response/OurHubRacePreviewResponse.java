package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class OurHubRacePreviewResponse {

    private String externalRaceId;
    private String raceName;
    private String courseName;
    private LocalDate raceDate;
    private String raceTime;
    private LocalDateTime raceStartTime;
    private String distanceText;
    private Integer distanceMeters;
    private Integer runnerCount;
    private List<OurHubRunnerPreviewResponse> runners;
}
