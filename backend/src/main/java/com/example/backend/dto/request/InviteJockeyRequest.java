package com.example.backend.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InviteJockeyRequest {

    @NotNull(message = "Mã giải đấu là bắt buộc")
    private Integer tournamentId;

    @NotNull(message = "Mã ngựa là bắt buộc")
    private Integer horseId;

    @NotNull(message = "Mã nài ngựa là bắt buộc")
    private Integer jockeyId;

    @Future(message = "Thời gian hết hạn phải ở trong tương lai")
    private LocalDateTime expiredAt;

    private String message;
}
