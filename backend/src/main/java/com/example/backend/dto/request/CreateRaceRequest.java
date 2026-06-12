package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public class CreateRaceRequest {

    @NotNull(message = "Vòng đấu là bắt buộc")
    private Integer roundId;

    @NotNull(message = "Thời gian bắt đầu là bắt buộc")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc là bắt buộc")
    private LocalDateTime endTime;

    @NotNull(message = "Cự ly là bắt buộc")
    @Positive(message = "Cự ly phải lớn hơn 0")
    private Integer distance;

    public Integer getRoundId() {
        return roundId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public Integer getDistance() {
        return distance;
    }
}
