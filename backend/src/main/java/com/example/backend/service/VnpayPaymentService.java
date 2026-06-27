package com.example.backend.service;

import com.example.backend.config.VnpayProperties;
import com.example.backend.constant.PaymentPurpose;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.PaymentTransactionStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.response.PaymentTransactionResponse;
import com.example.backend.dto.response.VnpayPaymentResultResponse;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.PaymentTransactionRepository;
import com.example.backend.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class VnpayPaymentService {

    private static final String PROVIDER_VNPAY = "VNPAY";
    private static final String VNPAY_VERSION = "2.1.0";
    private static final String VNPAY_COMMAND_PAY = "pay";
    private static final String VNPAY_CURRENCY = "VND";
    private static final String VNPAY_ORDER_TYPE = "other";
    private static final String VNPAY_LOCALE = "vn";
    private static final String VNPAY_SUCCESS_CODE = "00";
    private static final DateTimeFormatter VNPAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VnpayProperties properties;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RegistrationRepository registrationRepository;

    public VnpayPaymentService(
            VnpayProperties properties,
            PaymentTransactionRepository paymentTransactionRepository,
            RegistrationRepository registrationRepository
    ) {
        this.properties = properties;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional
    public PaymentTransaction createRegistrationFeePayment(
            Registration registration,
            Tournament tournament,
            String clientIp
    ) {
        BigDecimal amount = tournament.getEntryFee();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament entry fee must be greater than zero for VNPAY payment."
            );
        }

        PaymentTransaction paymentTransaction = new PaymentTransaction();
        paymentTransaction.setUserId(registration.getOwnerId());
        paymentTransaction.setRegistrationId(registration.getRegistrationId());
        paymentTransaction.setPurpose(PaymentPurpose.REGISTRATION_FEE);
        paymentTransaction.setProvider(PROVIDER_VNPAY);
        paymentTransaction.setAmount(amount);
        paymentTransaction.setCurrency(VNPAY_CURRENCY);
        paymentTransaction.setTxnRef(generateTxnRef(registration));
        paymentTransaction.setStatus(PaymentTransactionStatus.PENDING);

        String paymentUrl = buildPaymentUrl(paymentTransaction, registration, clientIp);
        paymentTransaction.setPayUrl(paymentUrl);

        return paymentTransactionRepository.save(paymentTransaction);
    }

    @Transactional
    public VnpayPaymentResultResponse processVnpayCallback(
            Map<String, String> requestParams
    ) {
        String txnRef = requestParams.get("vnp_TxnRef");
        String responseCode = requestParams.get("vnp_ResponseCode");
        String transactionStatus = requestParams.get("vnp_TransactionStatus");

        if (txnRef == null || txnRef.isBlank()) {
            return invalidResult("Missing vnp_TxnRef.", null, responseCode, transactionStatus);
        }

        if (!isValidSignature(requestParams)) {
            return invalidResult("Invalid VNPAY signature.", txnRef, responseCode, transactionStatus);
        }

        PaymentTransaction paymentTransaction =
                paymentTransactionRepository.findByTxnRefForUpdate(txnRef)
                        .orElse(null);

        if (paymentTransaction == null) {
            return VnpayPaymentResultResponse.builder()
                    .validSignature(true)
                    .success(false)
                    .message("Payment transaction does not exist.")
                    .txnRef(txnRef)
                    .responseCode(responseCode)
                    .transactionStatus(transactionStatus)
                    .build();
        }

        Registration registration = registrationRepository
                .findByIdForUpdate(paymentTransaction.getRegistrationId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Registration does not exist."
                ));

        if (!isCallbackAmountValid(requestParams, paymentTransaction)) {
            markPaymentFailed(
                    paymentTransaction,
                    registration,
                    responseCode,
                    requestParams
            );
            return buildResult(
                    paymentTransaction,
                    registration,
                    false,
                    "Payment amount does not match registration fee.",
                    responseCode,
                    transactionStatus
            );
        }

        if (PaymentTransactionStatus.SUCCESS.equals(paymentTransaction.getStatus())) {
            return buildResult(
                    paymentTransaction,
                    registration,
                    true,
                    "Payment was already confirmed.",
                    responseCode,
                    transactionStatus
            );
        }

        boolean success =
                VNPAY_SUCCESS_CODE.equals(responseCode)
                        && VNPAY_SUCCESS_CODE.equals(transactionStatus);

        paymentTransaction.setProviderTransactionNo(
                requestParams.get("vnp_TransactionNo")
        );
        paymentTransaction.setResponseCode(responseCode);
        paymentTransaction.setRawResponse(toRawResponse(requestParams));

        if (success) {
            paymentTransaction.setStatus(PaymentTransactionStatus.SUCCESS);
            paymentTransaction.setPaidAt(LocalDateTime.now());
            registration.setPaymentStatus(PaymentStatus.PAID);
        } else {
            paymentTransaction.setStatus(PaymentTransactionStatus.FAILED);
            registration.setPaymentStatus(PaymentStatus.FAILED);
            registration.setApprovalStatus(RegistrationStatus.CANCELLED);
        }

        paymentTransactionRepository.save(paymentTransaction);
        registrationRepository.save(registration);

        return buildResult(
                paymentTransaction,
                registration,
                success,
                success ? "Payment confirmed successfully." : "Payment failed.",
                responseCode,
                transactionStatus
        );
    }

    public PaymentTransactionResponse toResponse(
            PaymentTransaction paymentTransaction
    ) {
        if (paymentTransaction == null) {
            return null;
        }

        return PaymentTransactionResponse.builder()
                .paymentTransactionId(paymentTransaction.getPaymentTransactionId())
                .registrationId(paymentTransaction.getRegistrationId())
                .purpose(paymentTransaction.getPurpose())
                .provider(paymentTransaction.getProvider())
                .amount(paymentTransaction.getAmount())
                .currency(paymentTransaction.getCurrency())
                .txnRef(paymentTransaction.getTxnRef())
                .providerTransactionNo(paymentTransaction.getProviderTransactionNo())
                .status(paymentTransaction.getStatus())
                .responseCode(paymentTransaction.getResponseCode())
                .createdAt(paymentTransaction.getCreatedAt())
                .paidAt(paymentTransaction.getPaidAt())
                .build();
    }

    private String buildPaymentUrl(
            PaymentTransaction paymentTransaction,
            Registration registration,
            String clientIp
    ) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Version", VNPAY_VERSION);
        params.put("vnp_Command", VNPAY_COMMAND_PAY);
        params.put("vnp_TmnCode", properties.getTmnCode());
        params.put(
                "vnp_Amount",
                toVnpayAmount(paymentTransaction.getAmount())
        );
        params.put("vnp_CurrCode", VNPAY_CURRENCY);
        params.put("vnp_TxnRef", paymentTransaction.getTxnRef());
        params.put(
                "vnp_OrderInfo",
                "Tournament registration fee " + registration.getRegistrationNo()
        );
        params.put("vnp_OrderType", VNPAY_ORDER_TYPE);
        params.put("vnp_Locale", VNPAY_LOCALE);
        params.put("vnp_ReturnUrl", properties.getReturnUrl());
        params.put("vnp_IpAddr", normalizeClientIp(clientIp));
        params.put("vnp_CreateDate", now.format(VNPAY_DATE_FORMAT));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(VNPAY_DATE_FORMAT));

        String secureHash = hmacSha512(properties.getHashSecret(), hashData(params));
        return properties.getPayUrl()
                + "?"
                + queryString(params)
                + "&vnp_SecureHash="
                + secureHash;
    }

    private String generateTxnRef(Registration registration) {
        return "REG-" + registration.getRegistrationId() + "-" + System.currentTimeMillis();
    }

    private String normalizeClientIp(String clientIp) {
        if (clientIp == null || clientIp.isBlank() || "0:0:0:0:0:0:0:1".equals(clientIp)) {
            return "127.0.0.1";
        }
        return clientIp;
    }

    private String toVnpayAmount(BigDecimal amount) {
        return amount
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private boolean isValidSignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null || receivedHash.isBlank()) {
            return false;
        }

        String calculatedHash = hmacSha512(
                properties.getHashSecret(),
                hashData(filterHashParams(params))
        );

        return receivedHash.equalsIgnoreCase(calculatedHash);
    }

    private Map<String, String> filterHashParams(Map<String, String> params) {
        return params.entrySet()
                .stream()
                .filter(entry -> entry.getValue() != null)
                .filter(entry -> !entry.getKey().equals("vnp_SecureHash"))
                .filter(entry -> !entry.getKey().equals("vnp_SecureHashType"))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    private String hashData(Map<String, String> params) {
        return params.entrySet()
                .stream()
                .filter(entry -> entry.getValue() != null)
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String queryString(Map<String, String> params) {
        return params.entrySet()
                .stream()
                .filter(entry -> entry.getValue() != null)
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(bytes.length * 2);
            for (byte currentByte : bytes) {
                hash.append(String.format("%02x", currentByte));
            }
            return hash.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException exception) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Cannot create VNPAY secure hash."
            );
        }
    }

    private boolean isCallbackAmountValid(
            Map<String, String> requestParams,
            PaymentTransaction paymentTransaction
    ) {
        String rawAmount = requestParams.get("vnp_Amount");
        if (rawAmount == null || rawAmount.isBlank()) {
            return false;
        }

        try {
            BigDecimal callbackAmount =
                    new BigDecimal(rawAmount).divide(BigDecimal.valueOf(100));
            return callbackAmount.compareTo(paymentTransaction.getAmount()) == 0;
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    private void markPaymentFailed(
            PaymentTransaction paymentTransaction,
            Registration registration,
            String responseCode,
            Map<String, String> requestParams
    ) {
        paymentTransaction.setStatus(PaymentTransactionStatus.FAILED);
        paymentTransaction.setResponseCode(responseCode);
        paymentTransaction.setRawResponse(toRawResponse(requestParams));
        registration.setPaymentStatus(PaymentStatus.FAILED);
        registration.setApprovalStatus(RegistrationStatus.CANCELLED);
        paymentTransactionRepository.save(paymentTransaction);
        registrationRepository.save(registration);
    }

    private String toRawResponse(Map<String, String> requestParams) {
        return requestParams.entrySet()
                .stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(entry -> entry.getKey() + "=" + Objects.toString(entry.getValue(), ""))
                .collect(Collectors.joining("&"));
    }

    private VnpayPaymentResultResponse invalidResult(
            String message,
            String txnRef,
            String responseCode,
            String transactionStatus
    ) {
        return VnpayPaymentResultResponse.builder()
                .validSignature(false)
                .success(false)
                .message(message)
                .txnRef(txnRef)
                .responseCode(responseCode)
                .transactionStatus(transactionStatus)
                .build();
    }

    private VnpayPaymentResultResponse buildResult(
            PaymentTransaction paymentTransaction,
            Registration registration,
            boolean success,
            String message,
            String responseCode,
            String transactionStatus
    ) {
        return VnpayPaymentResultResponse.builder()
                .validSignature(true)
                .success(success)
                .message(message)
                .txnRef(paymentTransaction.getTxnRef())
                .responseCode(responseCode)
                .transactionStatus(transactionStatus)
                .registrationId(registration.getRegistrationId())
                .registrationPaymentStatus(registration.getPaymentStatus())
                .amount(paymentTransaction.getAmount())
                .build();
    }
}
