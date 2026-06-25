package com.example.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReviewFeedbackRequest {
    @NotBlank(message = "Phản hồi là bắt buộc")
    @Size(max = 500, message = "Phản hồi không được vượt quá 500 ký tự")
    @JsonAlias({"rejectionReason", "rejectReason"})
    private String feedback;
}
