package com.example.backend.service;

import com.example.backend.constant.WalletReferenceType;
import com.example.backend.constant.WalletStatus;
import com.example.backend.constant.WalletTransactionType;
import com.example.backend.enums.KycStatus;
import com.example.backend.dto.request.WalletDepositRequest;
import com.example.backend.dto.response.WalletDepositResponse;
import com.example.backend.dto.response.WalletResponse;
import com.example.backend.dto.response.WalletTransactionResponse;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.entity.User;
import com.example.backend.entity.Wallet;
import com.example.backend.entity.WalletTransaction;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.UserVerificationRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private static final String VND = "VND";
    private static final String SPECTATOR = "SPECTATOR";
    private static final BigDecimal MIN_DEPOSIT_AMOUNT = new BigDecimal("10000.00");

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserVerificationRepository userVerificationRepository;
    private final VnpayPaymentService vnpayPaymentService;

    @Transactional
    public WalletResponse getMyWallet(String email) {
        // Lấy user hiện tại và kiểm tra quyền dùng ví.
        User user = getUserByEmail(email);
        validateWalletAllowedRole(user);

        // Query wallet của user; nếu chưa có thì yêu cầu hoàn tất KYC để mở ví.
        Wallet wallet = walletRepository.findByUserId(user.getUserID())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Ví chưa được mở. Vui lòng hoàn tất xác minh KYC."
                ));
        return mapToResponse(wallet);
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getMyWalletTransactions(String email) {
        // Lấy lịch sử ví của chính spectator đang đăng nhập.
        User user = getUserByEmail(email);
        validateWalletAllowedRole(user);
        Wallet wallet = walletRepository.findByUserId(user.getUserID())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Ví chưa được mở. Vui lòng hoàn tất xác minh KYC."
                ));
        ensureWalletActive(wallet);

        return walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(user.getUserID())
                .stream()
                .filter(transaction -> wallet.getWalletId().equals(transaction.getWalletId()))
                .map(this::mapTransactionToResponse)
                .toList();
    }

    @Transactional
    public WalletDepositResponse createDepositPayment(
            String email,
            WalletDepositRequest request,
            String clientIp
    ) {
        // Kiểm tra user, role và KYC trước khi cho tạo payment nạp tiền.
        User user = getUserByEmail(email);
        validateWalletAllowedRole(user);
        validateVerifiedKyc(user);
        BigDecimal amount = normalizeAmount(request.getAmount());

        // Lock wallet để tránh tạo trùng hoặc cập nhật sai khi có nhiều request.
        Wallet wallet = walletRepository.findByUserIdForUpdate(user.getUserID())
                .orElseGet(() -> walletRepository.save(newWallet(user.getUserID())));
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
        validateWalletAllowedRole(user);
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

    private void validateWalletAllowedRole(User user) {
        // Hiện tại ví chỉ cho spectator active; mở cho owner/jockey thì sửa điều kiện này.
        String roleName = user.getRole() != null
                ? user.getRole().getRoleName()
                : null;
        String accountType = user.getAccountType();
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())
                || roleName == null
                || accountType == null
                || !SPECTATOR.equals(roleName.trim().toUpperCase(Locale.ROOT))
                || !SPECTATOR.equals(accountType.trim().toUpperCase(Locale.ROOT))) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Chỉ tài khoản Spectator được phép sử dụng ví."
            );
        }
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

    private void validateVerifiedKyc(User user) {
        // Nạp tiền yêu cầu KYC VERIFIED và chưa hết hạn.
        var verification = userVerificationRepository
                .findFirstByUserIdAndStatusOrderByAttemptNumberDesc(user.getUserID(), KycStatus.VERIFIED)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.FORBIDDEN,
                        "Bạn phải hoàn tất xác minh KYC trước khi nạp tiền."
                ));
        if (KycStatus.VERIFIED != verification.getStatus()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Hồ sơ KYC chưa được xác minh."
            );
        }
        if (verification.getExpiresAt() != null
                && !verification.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Hồ sơ KYC đã hết hạn."
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

    private Wallet newWallet(Integer userId) {
        // Tạo ví mặc định lần đầu với số dư 0 và tiền tệ VND.
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

    private WalletTransactionResponse mapTransactionToResponse(WalletTransaction transaction) {
        return WalletTransactionResponse.builder()
                .walletTransactionId(transaction.getWalletTransactionId())
                .walletId(transaction.getWalletId())
                .userId(transaction.getUserId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .balanceBefore(transaction.getBalanceBefore())
                .balanceAfter(transaction.getBalanceAfter())
                .lockedBefore(transaction.getLockedBefore())
                .lockedAfter(transaction.getLockedAfter())
                .referenceType(transaction.getReferenceType())
                .referenceId(transaction.getReferenceId())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
