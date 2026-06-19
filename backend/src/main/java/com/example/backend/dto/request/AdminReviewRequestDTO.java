package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReviewRequestDTO {
    
    @NotBlank(message = "Trạng thái phê duyệt là bắt buộc")
    private String status; // APPROVED or REJECTED
    
    private String rejectionReason;
}
