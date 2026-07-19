package com.example.backend.service;

import com.example.backend.dto.response.AdminSystemWalletResponse;
import com.example.backend.entity.FundTransaction;
import com.example.backend.entity.Role;
import com.example.backend.entity.SystemFund;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.FundTransactionRepository;
import com.example.backend.repository.SystemFundRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSystemWalletServiceTest {

    private static final String ADMIN_EMAIL = "admin@test.com";

    @Mock
    private SystemFundRepository systemFundRepository;
    @Mock
    private FundTransactionRepository fundTransactionRepository;
    @Mock
    private UserRepository userRepository;

    private AdminSystemWalletService service;

    @BeforeEach
    void setUp() {
        service = new AdminSystemWalletService(
                systemFundRepository,
                fundTransactionRepository,
                userRepository
        );
    }

    @Test
    void getSystemWalletReturnsBalanceAndSystemTransactionsForActiveAdmin() {
        SystemFund systemFund = systemFund();
        FundTransaction transaction = systemTransaction();
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(user("ADMIN", "ACTIVE")));
        when(systemFundRepository.findById(SystemFund.SINGLETON_ID)).thenReturn(Optional.of(systemFund));
        when(fundTransactionRepository.findTop50ByFundKeyOrderByCreatedAtDesc("SYSTEM"))
                .thenReturn(List.of(transaction));

        AdminSystemWalletResponse result = service.getSystemWallet(ADMIN_EMAIL);

        assertEquals(SystemFund.SINGLETON_ID, result.getSystemFundId());
        assertEquals(new BigDecimal("60000.00"), result.getBalance());
        assertEquals(new BigDecimal("60000.00"), result.getBettingFeeRevenue());
        assertEquals("VND", result.getCurrency());
        assertEquals(systemFund.getUpdatedAt(), result.getUpdatedAt());
        assertEquals(1, result.getTransactions().size());
        AdminSystemWalletResponse.SystemFundTransactionResponse row = result.getTransactions().getFirst();
        assertEquals(17L, row.getFundTransactionId());
        assertEquals("BETTING_OPERATOR_FEE", row.getTransactionType());
        assertEquals("CREDIT", row.getDirection());
        assertEquals(new BigDecimal("60000.00"), row.getAmount());
        assertEquals(new BigDecimal("0.00"), row.getBalanceBefore());
        assertEquals(new BigDecimal("60000.00"), row.getBalanceAfter());
        assertEquals("BET_SETTLEMENT", row.getReferenceType());
        assertEquals(1, row.getReferenceId());
        assertNotNull(row.getCreatedAt());
        verify(fundTransactionRepository).findTop50ByFundKeyOrderByCreatedAtDesc("SYSTEM");
    }

    @Test
    void getSystemWalletReturnsZeroBalanceWhenSystemFundDoesNotExistYet() {
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(user("ADMIN", "ACTIVE")));
        when(systemFundRepository.findById(SystemFund.SINGLETON_ID)).thenReturn(Optional.empty());
        when(fundTransactionRepository.findTop50ByFundKeyOrderByCreatedAtDesc("SYSTEM"))
                .thenReturn(List.of());

        AdminSystemWalletResponse result = service.getSystemWallet(ADMIN_EMAIL);

        assertEquals(BigDecimal.ZERO, result.getBalance());
        assertEquals(BigDecimal.ZERO, result.getBettingFeeRevenue());
        assertEquals(0, result.getTransactions().size());
        verify(fundTransactionRepository).findTop50ByFundKeyOrderByCreatedAtDesc("SYSTEM");
    }

    @Test
    void getSystemWalletRejectsNonAdminUser() {
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(user("OWNER", "ACTIVE")));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getSystemWallet(ADMIN_EMAIL)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void getSystemWalletRejectsInactiveAdmin() {
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(user("ADMIN", "INACTIVE")));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getSystemWallet(ADMIN_EMAIL)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void getSystemWalletRejectsMissingAuthenticatedUser() {
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getSystemWallet(ADMIN_EMAIL)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    private SystemFund systemFund() {
        SystemFund fund = new SystemFund();
        fund.setSystemFundId(SystemFund.SINGLETON_ID);
        fund.setBalance(new BigDecimal("60000.00"));
        fund.setBettingFeeRevenue(new BigDecimal("60000.00"));
        fund.setUpdatedAt(LocalDateTime.now());
        return fund;
    }

    private FundTransaction systemTransaction() {
        FundTransaction transaction = new FundTransaction();
        transaction.setFundTransactionId(17L);
        transaction.setFundKey("SYSTEM");
        transaction.setTransactionType("BETTING_OPERATOR_FEE");
        transaction.setDirection("CREDIT");
        transaction.setAmount(new BigDecimal("60000.00"));
        transaction.setBalanceBefore(new BigDecimal("0.00"));
        transaction.setBalanceAfter(new BigDecimal("60000.00"));
        transaction.setReferenceType("BET_SETTLEMENT");
        transaction.setReferenceId(1);
        transaction.setDescription("Betting operator fee");
        transaction.setCreatedAt(LocalDateTime.now());
        return transaction;
    }

    private User user(String roleName, String status) {
        Role role = new Role();
        role.setRoleName(roleName);
        User user = new User();
        user.setEmail(ADMIN_EMAIL);
        user.setStatus(status);
        user.setRole(role);
        return user;
    }
}
