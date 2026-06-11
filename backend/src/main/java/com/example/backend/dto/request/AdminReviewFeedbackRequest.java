package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReviewFeedbackRequest {
    @NotBlank(message = "Feedback is required")
    @Size(max = 500, message = "Feedback must not exceed 500 characters")
    private String feedback;
}
