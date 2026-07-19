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

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private static final BigDecimal MIN_DEPOSIT_AMOUNT = new BigDecimal("10000.00");

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final VnpayPaymentService vnpayPaymentService;
    private final WalletAccessPolicy walletAccessPolicy;

    @Transactional
    public WalletResponse getMyWallet(String email) {
        // Lấy user hiện tại và kiểm tra quyền dùng ví.
        User user = getUserByEmail(email);
        walletAccessPolicy.validate(user);

        // Ví professional được cấp khi Admin duyệt; ví Spectator được cấp sau KYC.
        Wallet wallet = walletRepository.findByUserId(user.getUserID())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Ví chưa được cấp cho tài khoản này."
                ));
        return mapToResponse(wallet);
    }

    @Transactional
    public WalletDepositResponse createDepositPayment(
            String email,
            WalletDepositRequest request,
            String clientIp
    ) {
        // Owner/Jockey được dùng ví sau khi được duyệt; Spectator vẫn phải KYC.
        User user = getUserByEmail(email);
        walletAccessPolicy.validate(user);
        BigDecimal amount = normalizeAmount(request.getAmount());

        // Lock wallet để tránh tạo trùng hoặc cập nhật sai khi có nhiều request.
        Wallet wallet = walletRepository.findByUserIdForUpdate(user.getUserID())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Wallet has not been provisioned for this account."
                ));
        ensureWalletActive(wallet);

        // Tạo giao dịch thanh toán VNPAY cho lần nạp ví này.
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
        // Lock wallet theo payment callback để cộng tiền an toàn.
        Wallet wallet = walletRepository
                .findByWalletIdForUpdate(paymentTransaction.getWalletId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Wallet does not exist."
                ));
        User user = userRepository.findById(wallet.getUserId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Người dùng không tồn tại."
                ));
        // Kiểm tra lại quyền và trạng thái ví trước khi cộng tiền.
        walletAccessPolicy.validate(user);
        ensureWalletActive(wallet);

        // Cộng balance và lưu wallet transaction để có lịch sử nạp tiền.
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
        // Query user theo email lấy từ JWT.
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Người dùng không tồn tại."
                ));
    }

    private void ensureWalletActive(Wallet wallet) {
        // Ví phải ACTIVE mới được xem, nạp tiền hoặc dùng cho betting.
        if (!WalletStatus.ACTIVE.equals(wallet.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Ví hiện không hoạt động."
            );
        }
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(MIN_DEPOSIT_AMOUNT) < 0) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Wallet deposit amount must be at least 10,000 VND."
            );
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
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
