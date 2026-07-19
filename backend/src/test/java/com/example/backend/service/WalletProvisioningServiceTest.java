package com.example.backend.service;

import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.entity.Wallet;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletProvisioningServiceTest {

    @Mock private WalletRepository walletRepository;

    private WalletProvisioningService service;

    @BeforeEach
    void setUp() {
        service = new WalletProvisioningService(walletRepository);
    }

    @Test
    void provisionsZeroBalanceWalletForApprovedOwner() {
        User owner = user("OWNER", "OWNER");
        when(walletRepository.findByUserIdForUpdate(owner.getUserID())).thenReturn(Optional.empty());
        when(walletRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        Wallet wallet = service.provisionForApprovedProfessional(owner);

        assertEquals(owner.getUserID(), wallet.getUserId());
        assertEquals(BigDecimal.ZERO, wallet.getBalance());
        assertEquals("ACTIVE", wallet.getStatus());
    }

    @Test
    void provisioningIsIdempotent() {
        User jockey = user("JOCKEY", "JOCKEY");
        Wallet existing = Wallet.builder().walletId(7).userId(jockey.getUserID()).build();
        when(walletRepository.findByUserIdForUpdate(jockey.getUserID()))
                .thenReturn(Optional.of(existing));

        Wallet wallet = service.provisionForApprovedProfessional(jockey);

        assertSame(existing, wallet);
        verify(walletRepository, never()).save(any());
    }

    @Test
    void doesNotProvisionProfessionalWalletBeforeApproval() {
        User candidate = user("SPECTATOR", "JOCKEY");

        assertThrows(ApiException.class,
                () -> service.provisionForApprovedProfessional(candidate));
        verify(walletRepository, never()).findByUserIdForUpdate(any());
    }

    private User user(String roleName, String accountType) {
        Role role = new Role();
        role.setRoleName(roleName);
        User user = new User();
        user.setUserID(10);
        user.setRole(role);
        user.setAccountType(accountType);
        return user;
    }
}
