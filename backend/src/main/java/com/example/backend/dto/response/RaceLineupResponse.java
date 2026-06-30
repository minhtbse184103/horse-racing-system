package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class RaceLineupResponse {

    private Integer raceId;
    private String raceName;
    private String trackName;
    private Integer distance;
    private String status;
    private List<RaceLineupEntryResponse> runners;
}
