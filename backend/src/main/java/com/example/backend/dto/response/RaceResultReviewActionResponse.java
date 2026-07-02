package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class RaceResultReviewActionResponse {

    private Integer reviewActionId;
    private Integer actorUserId;
    private String actorRole;
    private String action;
    private String comment;
    private LocalDateTime createdAt;
}
