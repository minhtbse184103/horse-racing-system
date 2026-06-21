package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePaymentStatusRequest {

    @NotBlank(message = "Payment status is required.")
    @Pattern(
            regexp = "UNPAID|PAID|REFUNDED|FAILED",
            message = "Unsupported payment status."
    )
    private String paymentStatus;
}