package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WalletDepositRequest {

    @Schema(example = "100000")
    @NotNull(message = "Số tiền nạp là bắt buộc.")
    @DecimalMin(value = "1000.00", message = "Số tiền nạp tối thiểu là 1,000 VND.")
    private BigDecimal amount;
}
