package com.example.backend.service;

import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.entity.UserVerification;
import com.example.backend.enums.KycStatus;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.UserVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletAccessPolicyTest {

    @Mock private UserVerificationRepository verificationRepository;

    private WalletAccessPolicy policy;

    @BeforeEach
    void setUp() {
        policy = new WalletAccessPolicy(verificationRepository);
    }

    @Test
    void approvedOwnerDoesNotNeedKyc() {
        assertDoesNotThrow(() -> policy.validate(user("OWNER", "OWNER")));
        verifyNoInteractions(verificationRepository);
    }

    @Test
    void approvedJockeyDoesNotNeedKyc() {
        assertDoesNotThrow(() -> policy.validate(user("JOCKEY", "JOCKEY")));
        verifyNoInteractions(verificationRepository);
    }

    @Test
    void pendingProfessionalCandidateCannotUseSpectatorWalletAccess() {
        assertThrows(ApiException.class, () -> policy.validate(user("SPECTATOR", "OWNER")));
        verifyNoInteractions(verificationRepository);
    }

    @Test
    void spectatorRequiresCurrentVerifiedKyc() {
        User spectator = user("SPECTATOR", "SPECTATOR");
        when(verificationRepository.findFirstByUserIdAndStatusOrderByAttemptNumberDesc(
                spectator.getUserID(), KycStatus.VERIFIED)).thenReturn(Optional.empty());

        assertThrows(ApiException.class, () -> policy.validate(spectator));
    }

    @Test
    void verifiedSpectatorCanUseWallet() {
        User spectator = user("SPECTATOR", "SPECTATOR");
        UserVerification verification = UserVerification.builder()
                .userId(spectator.getUserID())
                .status(KycStatus.VERIFIED)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();
        when(verificationRepository.findFirstByUserIdAndStatusOrderByAttemptNumberDesc(
                spectator.getUserID(), KycStatus.VERIFIED)).thenReturn(Optional.of(verification));

        assertDoesNotThrow(() -> policy.validate(spectator));
    }

    @Test
    void spectatorWithExpiredKycCannotUseWallet() {
        User spectator = user("SPECTATOR", "SPECTATOR");
        UserVerification verification = UserVerification.builder()
                .userId(spectator.getUserID())
                .status(KycStatus.VERIFIED)
                .expiresAt(LocalDateTime.now().minusSeconds(1))
                .build();
        when(verificationRepository.findFirstByUserIdAndStatusOrderByAttemptNumberDesc(
                spectator.getUserID(), KycStatus.VERIFIED)).thenReturn(Optional.of(verification));

        assertThrows(ApiException.class, () -> policy.validate(spectator));
    }

    private User user(String roleName, String accountType) {
        Role role = new Role();
        role.setRoleName(roleName);
        User user = new User();
        user.setUserID(10);
        user.setStatus("ACTIVE");
        user.setRole(role);
        user.setAccountType(accountType);
        return user;
    }
}
