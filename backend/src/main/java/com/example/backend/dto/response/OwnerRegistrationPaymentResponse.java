package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OwnerRegistrationPaymentResponse {

    private RegistrationResponse registration;
    private PaymentTransactionResponse paymentTransaction;
    private String paymentUrl;
}
