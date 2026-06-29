package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceLaunchResponse {

    private Integer raceId;
    private String status;
    private LocalDateTime launchedAt;
    private String raceEngineToken;

    // false when race.engine.unity-executable-path isn't configured: the
    // race is still marked live (runStartedAt set) but no process was
    // spawned, so an admin/tester needs to start Unity manually (e.g.
    // Editor Play mode) pointed at this raceId.
    private boolean engineProcessStarted;
}
