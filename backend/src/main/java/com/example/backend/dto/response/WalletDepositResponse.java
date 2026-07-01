package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WalletDepositResponse {

    private WalletResponse wallet;
    private PaymentTransactionResponse paymentTransaction;
    private String paymentUrl;
}
