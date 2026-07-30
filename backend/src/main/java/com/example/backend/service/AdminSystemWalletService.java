package com.example.backend.service;

import com.example.backend.dto.response.AdminSystemWalletResponse;
import com.example.backend.entity.FundTransaction;
import com.example.backend.entity.SystemFund;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.FundTransactionRepository;
import com.example.backend.repository.SystemFundRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminSystemWalletService {

    private static final String ACTIVE = "ACTIVE";
    private static final String ADMIN = "ADMIN";
    private static final String SYSTEM_FUND_KEY = "SYSTEM";
    private static final String VND = "VND";

    private final SystemFundRepository systemFundRepository;
    private final FundTransactionRepository fundTransactionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AdminSystemWalletResponse getSystemWallet(String authenticatedEmail) {
        validateActiveAdmin(authenticatedEmail);

        SystemFund systemFund = systemFundRepository.findById(SystemFund.SINGLETON_ID).orElse(null);
        List<AdminSystemWalletResponse.SystemFundTransactionResponse> transactions =
                fundTransactionRepository.findTop50ByFundKeyOrderByCreatedAtDesc(SYSTEM_FUND_KEY)
                        .stream()
                        .map(this::toTransactionResponse)
                        .toList();

        return AdminSystemWalletResponse.builder()
                .systemFundId(SystemFund.SINGLETON_ID)
                .balance(systemFund != null ? money(systemFund.getBalance()) : BigDecimal.ZERO)
                .bettingFeeRevenue(systemFund != null ? money(systemFund.getBettingFeeRevenue()) : BigDecimal.ZERO)
                .minusPoolSubsidyPaid(
                        systemFund != null ? money(systemFund.getMinusPoolSubsidyPaid()) : BigDecimal.ZERO
                )
                .currency(VND)
                .updatedAt(systemFund != null ? systemFund.getUpdatedAt() : null)
                .transactions(transactions)
                .build();
    }

    private AdminSystemWalletResponse.SystemFundTransactionResponse toTransactionResponse(FundTransaction transaction) {
        return AdminSystemWalletResponse.SystemFundTransactionResponse.builder()
                .fundTransactionId(transaction.getFundTransactionId())
                .transactionType(transaction.getTransactionType())
                .direction(transaction.getDirection())
                .amount(money(transaction.getAmount()))
                .balanceBefore(money(transaction.getBalanceBefore()))
                .balanceAfter(money(transaction.getBalanceAfter()))
                .referenceType(transaction.getReferenceType())
                .referenceId(transaction.getReferenceId())
                .description(transaction.getDescription())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private void validateActiveAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user does not exist."));
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (!ADMIN.equalsIgnoreCase(roleName) || !ACTIVE.equalsIgnoreCase(user.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only active administrators can view system wallet.");
        }
    }

    private static BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
