package com.example.backend.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminRegistrationResponse {
    private Integer registrationId;
    private Integer tournamentId;
    private String tournamentName;
    private Integer horseId;
    private String horseName;
    private Integer ownerId;
    private String ownerName;
    private Integer jockeyId;
    private String jockeyName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}