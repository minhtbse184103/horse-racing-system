package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class VnpayPaymentResultResponse {

    private boolean validSignature;
    private boolean success;
    private String message;
    private String txnRef;
    private String responseCode;
    private String transactionStatus;
    private Integer registrationId;
    private String registrationPaymentStatus;
    private BigDecimal amount;
}
