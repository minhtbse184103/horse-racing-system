package com.example.backend.service;

import com.example.backend.entity.User;
import com.example.backend.enums.KycStatus;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.UserVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class WalletAccessPolicy {

    private static final Set<String> PROFESSIONAL_ACCOUNT_TYPES = Set.of("OWNER", "JOCKEY");
    private static final String SPECTATOR = "SPECTATOR";

    private final UserVerificationRepository userVerificationRepository;

    public void validate(User user) {
        if (user == null || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw forbidden();
        }

        String role = user.getRole() == null ? null : normalize(user.getRole().getRoleName());
        String accountType = normalize(user.getAccountType());

        if (role != null && role.equals(accountType) && PROFESSIONAL_ACCOUNT_TYPES.contains(role)) {
            return;
        }

        if (SPECTATOR.equals(role) && SPECTATOR.equals(accountType)) {
            validateSpectatorKyc(user.getUserID());
            return;
        }

        throw forbidden();
    }

    private void validateSpectatorKyc(Integer userId) {
        var verification = userVerificationRepository
                .findFirstByUserIdAndStatusOrderByAttemptNumberDesc(userId, KycStatus.VERIFIED)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.FORBIDDEN,
                        "Spectator must complete KYC before using a wallet."
                ));
        if (verification.getExpiresAt() != null
                && !verification.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Spectator KYC has expired.");
        }
    }

    private ApiException forbidden() {
        return new ApiException(HttpStatus.FORBIDDEN, "This account cannot use wallet services.");
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
