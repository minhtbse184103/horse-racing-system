package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RaceLineupEntryResponse {

    /**
     * Unity's "horseId" — by design this equals RaceEntry.startingStall,
     * not the real Horse.horseId. Unity only needs a small stable
     * per-race lane identifier; startingStall already is one.
     */
    private Integer horseId;

    private Integer startingStall;
    private String horseName;
    private String jockeyName;
}
