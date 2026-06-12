package com.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRaceEntryRequest {

    @NotNull(message = "Mã cuộc đua là bắt buộc")
    private Integer raceId;

    @NotNull(message = "Mã đơn đăng ký là bắt buộc")
    private Integer registrationId;
}
