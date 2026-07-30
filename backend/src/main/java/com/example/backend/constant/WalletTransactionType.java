package com.example.backend.constant;

public final class WalletTransactionType {

    public static final String DEPOSIT = "DEPOSIT";
    public static final String BET_LOCK = "BET_LOCK";
    public static final String BET_LOST = "BET_LOST";
    public static final String BET_WIN = "BET_WIN";
    public static final String BET_REFUND = "BET_REFUND";
    public static final String BET_VOID_REFUND = "BET_VOID_REFUND";
    public static final String PRIZE_PAYOUT = "PRIZE_PAYOUT";

    private WalletTransactionType() {
    }
}
