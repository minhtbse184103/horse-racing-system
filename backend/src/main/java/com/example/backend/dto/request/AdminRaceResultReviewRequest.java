package com.example.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminRaceResultReviewRequest {

    @Size(max = 1000, message = "Review reason must not exceed 1000 characters.")
    private String reason;
}
