package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentTransactionResponse {

    private Integer paymentTransactionId;
    private Integer registrationId;
    private Integer walletId;
    private String purpose;
    private String provider;
    private BigDecimal amount;
    private String currency;
    private String txnRef;
    private String providerTransactionNo;
    private String status;
    private String responseCode;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
