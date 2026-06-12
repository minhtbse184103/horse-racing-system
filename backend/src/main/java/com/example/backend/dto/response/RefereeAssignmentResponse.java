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
    private Integer raceOrder;
    private Integer distance;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String raceStatus;

    private Integer roundId;
    private String roundName;
    private Integer roundOrder;

    private Integer tournamentId;
    private String tournamentName;
    private String tournamentStatus;

    private Integer refereeUserId;
    private String refereeName;
    private String refereeEmail;
}