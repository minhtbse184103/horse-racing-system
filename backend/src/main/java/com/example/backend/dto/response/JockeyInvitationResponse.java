package com.example.backend.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JockeyInvitationResponse {
    private Integer invitationID;
    private Integer registrationID;
    private Integer raceID;
    private String horseName;
    private Integer ownerID;
    private String ownerName;
    private Integer jockeyID;
    private String jockeyName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private LocalDateTime confirmedAt;
}
