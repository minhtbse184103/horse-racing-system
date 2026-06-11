package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OwnerDashboardResponse {
    private Integer ownerId;
    private String ownerName;
    private long totalHorses;
    private long totalRegistrations;
    private long registeredHorses;
    private long participatedHorses;
}
