package com.example.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JockeyInvitationResponse {
    private Integer invitationId;
    private Integer registrationId;
    private Integer tournamentId;
    private String tournamentName;
    private LocalDate tournamentStartDate;
    private LocalDate tournamentEndDate;
    private Integer horseId;
    private String horseName;
    private Integer ownerId;
    private String ownerName;
    private Integer jockeyId;
    private String jockeyName;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private LocalDateTime expiredAt;
    private String status;
    private String registrationStatus;
}
