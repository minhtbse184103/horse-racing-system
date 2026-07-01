package com.example.backend.service;

import com.example.backend.constant.WalletReferenceType;
import com.example.backend.constant.WalletStatus;
import com.example.backend.constant.WalletTransactionType;
import com.example.backend.dto.request.WalletDepositRequest;
import com.example.backend.dto.response.WalletDepositResponse;
import com.example.backend.dto.response.WalletResponse;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.entity.User;
import com.example.backend.entity.Wallet;
import com.example.backend.entity.WalletTransaction;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private static final String VND = "VND";
    private static final Set<String> WALLET_ALLOWED_ROLES =
            Set.of("ADMIN", "OWNER", "SPECTATOR", "JOCKEY");

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final VnpayPaymentService vnpayPaymentService;

    @Transactional
    public WalletResponse getMyWallet(String email) {
        User user = getUserByEmail(email);
        validateWalletAllowedRole(user);

        Wallet wallet = walletRepository.findByUserId(user.getUserID())
                .orElseGet(() -> {
                    Wallet createdWallet = walletRepository.save(newWallet(user.getUserID()));
                    log.info(
                            "Created wallet for user. userId={}, walletId={}",
                            user.getUserID(),
                            createdWallet.getWalletId()
                    );
                    return createdWallet;
                });
        return mapToResponse(wallet);
    }

    @Transactional
    public WalletDepositResponse createDepositPayment(
            String email,
            WalletDepositRequest request,
            String clientIp
    ) {
        User user = getUserByEmail(email);
        validateWalletAllowedRole(user);
        BigDecimal amount = normalizeAmount(request.getAmount());

        Wallet wallet = walletRepository.findByUserIdForUpdate(user.getUserID())
                .orElseGet(() -> walletRepository.save(newWallet(user.getUserID())));
        ensureWalletActive(wallet);

        PaymentTransaction paymentTransaction =
                vnpayPaymentService.createWalletDepositPayment(wallet, amount, clientIp);

        log.info(
                "Created wallet deposit payment. userId={}, walletId={}, amount={}, txnRef={}",
                user.getUserID(),
                wallet.getWalletId(),
                amount,
                paymentTransaction.getTxnRef()
        );

        return WalletDepositResponse.builder()
                .wallet(mapToResponse(wallet))
                .paymentTransaction(vnpayPaymentService.toResponse(paymentTransaction))
                .paymentUrl(paymentTransaction.getPayUrl())
                .build();
    }

    @Transactional
    public WalletResponse applySuccessfulDeposit(PaymentTransaction paymentTransaction) {
        Wallet wallet = walletRepository
                .findByWalletIdForUpdate(paymentTransaction.getWalletId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Wallet does not exist."
                ));
        ensureWalletActive(wallet);

        BigDecimal balanceBefore = valueOrZero(wallet.getBalance());
        BigDecimal lockedBefore = valueOrZero(wallet.getLockedBalance());
        BigDecimal balanceAfter = balanceBefore.add(paymentTransaction.getAmount());

        wallet.setBalance(balanceAfter);
        walletRepository.save(wallet);

        WalletTransaction walletTransaction = new WalletTransaction();
        walletTransaction.setWalletId(wallet.getWalletId());
        walletTransaction.setUserId(wallet.getUserId());
        walletTransaction.setType(WalletTransactionType.DEPOSIT);
        walletTransaction.setAmount(paymentTransaction.getAmount());
        walletTransaction.setBalanceBefore(balanceBefore);
        walletTransaction.setBalanceAfter(balanceAfter);
        walletTransaction.setLockedBefore(lockedBefore);
        walletTransaction.setLockedAfter(lockedBefore);
        walletTransaction.setReferenceType(WalletReferenceType.PAYMENT_TRANSACTION);
        walletTransaction.setReferenceId(paymentTransaction.getPaymentTransactionId());
        walletTransaction.setDescription("VNPAY wallet deposit");
        walletTransactionRepository.save(walletTransaction);

        log.info(
                "Applied wallet deposit. userId={}, walletId={}, amount={}, balanceAfter={}",
                wallet.getUserId(),
                wallet.getWalletId(),
                paymentTransaction.getAmount(),
                balanceAfter
        );

        return mapToResponse(wallet);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Người dùng không tồn tại."
                ));
    }

    private void validateWalletAllowedRole(User user) {
        String roleName = user.getRole() != null
                ? user.getRole().getRoleName()
                : null;
        if (roleName == null || !WALLET_ALLOWED_ROLES.contains(roleName.toUpperCase())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Vai trò không được phép sử dụng ví."
            );
        }
    }

    private void ensureWalletActive(Wallet wallet) {
        if (!WalletStatus.ACTIVE.equals(wallet.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Ví hiện không hoạt động."
            );
        }
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Số tiền nạp phải lớn hơn 0."
            );
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private Wallet newWallet(Integer userId) {
        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setLockedBalance(BigDecimal.ZERO);
        wallet.setCurrency(VND);
        wallet.setStatus(WalletStatus.ACTIVE);
        return wallet;
    }

    private WalletResponse mapToResponse(Wallet wallet) {
        BigDecimal balance = valueOrZero(wallet.getBalance());
        BigDecimal lockedBalance = valueOrZero(wallet.getLockedBalance());
        return WalletResponse.builder()
                .walletId(wallet.getWalletId())
                .userId(wallet.getUserId())
                .balance(balance)
                .lockedBalance(lockedBalance)
                .availableBalance(balance.subtract(lockedBalance))
                .currency(wallet.getCurrency())
                .status(wallet.getStatus())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
