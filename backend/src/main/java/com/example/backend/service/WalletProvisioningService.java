package com.example.backend.service;

import com.example.backend.constant.WalletStatus;
import com.example.backend.entity.User;
import com.example.backend.entity.Wallet;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class WalletProvisioningService {

    private static final Set<String> PROFESSIONAL_ACCOUNT_TYPES = Set.of("OWNER", "JOCKEY");
    private static final String SPECTATOR = "SPECTATOR";

    private final WalletRepository walletRepository;

    @Transactional
    public Wallet provisionForApprovedProfessional(User user) {
        String role = roleName(user);
        String accountType = accountType(user);
        if (!PROFESSIONAL_ACCOUNT_TYPES.contains(role) || !role.equals(accountType)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Wallet can only be provisioned after the professional account is approved."
            );
        }
        return provisionIfAbsent(user.getUserID());
    }

    @Transactional
    public Wallet provisionForVerifiedSpectator(User user) {
        if (!SPECTATOR.equals(roleName(user)) || !SPECTATOR.equals(accountType(user))) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "KYC wallet provisioning is only available to Spectator accounts."
            );
        }
        return provisionIfAbsent(user.getUserID());
    }

    private Wallet provisionIfAbsent(Integer userId) {
        return walletRepository.findByUserIdForUpdate(userId)
                .orElseGet(() -> walletRepository.save(Wallet.builder()
                        .userId(userId)
                        .balance(BigDecimal.ZERO)
                        .lockedBalance(BigDecimal.ZERO)
                        .currency("VND")
                        .status(WalletStatus.ACTIVE)
                        .build()));
    }

    private String roleName(User user) {
        return user == null || user.getRole() == null
                ? null
                : normalize(user.getRole().getRoleName());
    }

    private String accountType(User user) {
        return user == null ? null : normalize(user.getAccountType());
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
