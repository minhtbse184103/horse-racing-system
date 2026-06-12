package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRefereeAssignmentRequest {

    @NotNull(message = "Mã cuộc đua là bắt buộc")
    private Integer raceId;

    @NotNull(message = "Mã người dùng trọng tài là bắt buộc")
    private Integer refereeUserId;
}
