package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class OwnerEntryFeeTransactionResponse {

    private Integer paymentTransactionId;
    private Integer registrationId;
    private String registrationNo;
    private Integer tournamentId;
    private String tournamentName;
    private Integer horseId;
    private String horseName;
    private Integer jockeyId;
    private String jockeyName;
    private BigDecimal amount;
    private String currency;
    private String provider;
    private String txnRef;
    private String providerTransactionNo;
    private String status;
    private String responseCode;
    private String registrationPaymentStatus;
    private String registrationApprovalStatus;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
