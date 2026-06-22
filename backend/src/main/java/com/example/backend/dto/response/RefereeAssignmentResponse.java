package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RefereeAssignmentResponse {

    private Integer assignmentId;
    private String assignmentStatus;
    private LocalDateTime assignedAt;

    private Integer raceId;
    private String raceName;
    private String trackName;
    private Integer raceOrder;
    private Integer distance;
    private Integer maxRunners;
    private LocalDateTime raceStartTime;
    private LocalDateTime raceEndTime;
    private String raceStatus;

    private Integer tournamentId;
    private String tournamentName;
    private String venue;
    private String tournamentStatus;

    private Integer refereeUserId;
    private String refereeName;
    private String refereeEmail;
}