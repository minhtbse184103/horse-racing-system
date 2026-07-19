package com.example.backend.service;

import com.example.backend.constant.WalletStatus;
import com.example.backend.dto.request.WalletDepositRequest;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.entity.Wallet;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletServiceSpectatorAccessTest {

    @Mock private UserRepository userRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private VnpayPaymentService vnpayPaymentService;
    @Mock private WalletAccessPolicy walletAccessPolicy;

    private WalletService service;

    @BeforeEach
    void setUp() {
        service = new WalletService(
                userRepository,
                walletRepository,
                walletTransactionRepository,
                vnpayPaymentService,
                walletAccessPolicy
        );
    }

    @Test
    void approvedOwnerCanReadProvisionedWallet() {
        User owner = user(8, "owner@test.local", "OWNER", "OWNER");
        Wallet wallet = wallet(81, owner.getUserID());
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(walletRepository.findByUserId(owner.getUserID())).thenReturn(Optional.of(wallet));

        var response = service.getMyWallet(owner.getEmail());

        assertEquals(wallet.getWalletId(), response.getWalletId());
        assertEquals(owner.getUserID(), response.getUserId());
        verify(walletAccessPolicy).validate(owner);
    }

    @Test
    void depositDoesNotCreateMissingWallet() {
        User owner = user(8, "owner@test.local", "OWNER", "OWNER");
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(walletRepository.findByUserIdForUpdate(owner.getUserID())).thenReturn(Optional.empty());

        assertThrows(ApiException.class,
                () -> service.createDepositPayment(owner.getEmail(), depositRequest(), "127.0.0.1"));
        verify(walletRepository, never()).save(any());
    }

    @Test
    void successfulDepositCreditsJockeyWallet() {
        User jockey = user(9, "jockey@test.local", "JOCKEY", "JOCKEY");
        Wallet wallet = wallet(91, jockey.getUserID());
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPaymentTransactionId(501);
        payment.setWalletId(wallet.getWalletId());
        payment.setAmount(new BigDecimal("100000.00"));
        when(walletRepository.findByWalletIdForUpdate(wallet.getWalletId()))
                .thenReturn(Optional.of(wallet));
        when(userRepository.findById(jockey.getUserID())).thenReturn(Optional.of(jockey));

        var response = service.applySuccessfulDeposit(payment);

        assertEquals(new BigDecimal("100000.00"), response.getBalance());
        assertEquals(new BigDecimal("100000.00"), wallet.getBalance());
        verify(walletRepository).save(wallet);
        verify(walletTransactionRepository).save(any());
    }

    private WalletDepositRequest depositRequest() {
        WalletDepositRequest request = new WalletDepositRequest();
        request.setAmount(new BigDecimal("100000.00"));
        return request;
    }

    private User user(Integer id, String email, String roleName, String accountType) {
        Role role = new Role();
        role.setRoleName(roleName);
        User user = new User();
        user.setUserID(id);
        user.setEmail(email);
        user.setStatus("ACTIVE");
        user.setAccountType(accountType);
        user.setRole(role);
        return user;
    }

    private Wallet wallet(Integer walletId, Integer userId) {
        Wallet wallet = new Wallet();
        wallet.setWalletId(walletId);
        wallet.setUserId(userId);
        wallet.setBalance(BigDecimal.ZERO.setScale(2));
        wallet.setLockedBalance(BigDecimal.ZERO.setScale(2));
        wallet.setCurrency("VND");
        wallet.setStatus(WalletStatus.ACTIVE);
        return wallet;
    }
}
