package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class WalletResponse {

    private Integer walletId;
    private Integer userId;
    private BigDecimal balance;
    private BigDecimal lockedBalance;
    private BigDecimal availableBalance;
    private String currency;
    private String status;
    private LocalDateTime updatedAt;
}
