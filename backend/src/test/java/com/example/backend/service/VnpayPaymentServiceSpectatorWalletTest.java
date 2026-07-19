package com.example.backend.service;

import com.example.backend.config.VnpayProperties;
import com.example.backend.constant.PaymentPurpose;
import com.example.backend.constant.PaymentTransactionStatus;
import com.example.backend.constant.WalletStatus;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.entity.Wallet;
import com.example.backend.repository.PaymentTransactionRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VnpayPaymentServiceSpectatorWalletTest {

    private static final String HASH_SECRET = "test-secret";

    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private RegistrationRepository registrationRepository;
    @Mock private UserRepository userRepository;
    @Mock private WalletRepository walletRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private FundAccountingService fundAccountingService;

    private VnpayPaymentService service;

    @BeforeEach
    void setUp() {
        VnpayProperties properties = new VnpayProperties();
        properties.setHashSecret(HASH_SECRET);
        service = new VnpayPaymentService(
                properties,
                paymentTransactionRepository,
                registrationRepository,
                userRepository,
                walletRepository,
                walletTransactionRepository,
                fundAccountingService
        );
    }

    @Test
    void validCallbackCreditsOwnerWallet() throws Exception {
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPaymentTransactionId(55);
        payment.setUserId(8);
        payment.setWalletId(88);
        payment.setPurpose(PaymentPurpose.WALLET_DEPOSIT);
        payment.setAmount(new BigDecimal("100000.00"));
        payment.setTxnRef("WALLET-OWNER-1");
        payment.setStatus(PaymentTransactionStatus.PENDING);

        Wallet wallet = new Wallet();
        wallet.setWalletId(88);
        wallet.setUserId(8);
        wallet.setBalance(BigDecimal.ZERO.setScale(2));
        wallet.setLockedBalance(BigDecimal.ZERO.setScale(2));
        wallet.setStatus(WalletStatus.ACTIVE);

        Role ownerRole = new Role();
        ownerRole.setRoleName("OWNER");
        User owner = new User();
        owner.setUserID(8);
        owner.setStatus("ACTIVE");
        owner.setRole(ownerRole);
        owner.setAccountType("OWNER");

        when(paymentTransactionRepository.findByTxnRefForUpdate(payment.getTxnRef()))
                .thenReturn(Optional.of(payment));
        when(walletRepository.findByWalletIdForUpdate(88)).thenReturn(Optional.of(wallet));
        when(userRepository.findById(8)).thenReturn(Optional.of(owner));

        Map<String, String> callback = signedCallback(payment);

        var result = service.processVnpayCallback(callback);

        assertEquals(true, result.isSuccess());
        assertEquals(PaymentTransactionStatus.SUCCESS, payment.getStatus());
        assertEquals(new BigDecimal("100000.00"), wallet.getBalance());
        verify(paymentTransactionRepository).save(payment);
        verify(walletRepository).save(wallet);
        verify(walletTransactionRepository).save(any());
    }

    private Map<String, String> signedCallback(PaymentTransaction payment) throws Exception {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_TxnRef", payment.getTxnRef());
        params.put("vnp_Amount", payment.getAmount().multiply(BigDecimal.valueOf(100)).toPlainString());
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TransactionNo", "VNP-1");

        String data = params.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(HASH_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        String hash = bytesToHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        params.put("vnp_SecureHash", hash);
        return params;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            result.append(String.format("%02x", value));
        }
        return result.toString();
    }
}
