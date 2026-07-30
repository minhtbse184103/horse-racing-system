package com.example.backend.controller;

import com.example.backend.dto.response.VnpayPaymentResultResponse;
import com.example.backend.service.VnpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
public class VnpayPaymentController {

    private final VnpayPaymentService vnpayPaymentService;
    private final String frontendUrl;

    public VnpayPaymentController(
            VnpayPaymentService vnpayPaymentService,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.vnpayPaymentService = vnpayPaymentService;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @GetMapping("/ipn")
    public Map<String, String> handleIpn(
            @RequestParam Map<String, String> requestParams
    ) {
        VnpayPaymentResultResponse result =
                vnpayPaymentService.processVnpayCallback(
                        new LinkedHashMap<>(requestParams)
                );

        if (!result.isValidSignature()) {
            return vnpayResponse("97", "Invalid signature");
        }
        if (result.getRegistrationId() == null && result.getWalletId() == null) {
            return vnpayResponse("01", "Order not found");
        }
        if (!result.isSuccess()) {
            return vnpayResponse("00", "Confirm Success");
        }
        return vnpayResponse("00", "Confirm Success");
    }

    @GetMapping("/return")
    public ResponseEntity<Void> handleReturn(
            HttpServletRequest request
    ) {
        // Đây là URL trình duyệt được VNPAY điều hướng tới, nên phải đưa người dùng
        // về React cùng nguyên query string thay vì hiển thị JSON của backend.
        String queryString = request.getQueryString();
        String redirectUrl = frontendUrl
                + (queryString == null || queryString.isBlank() ? "" : "?" + queryString);
        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

    @GetMapping("/confirm")
    public VnpayPaymentResultResponse confirmReturn(
            @RequestParam Map<String, String> requestParams
    ) {
        // Frontend gọi API này sau khi nhận query VNPAY để xác minh chữ ký và lấy kết quả.
        return vnpayPaymentService.processVnpayCallback(
                new LinkedHashMap<>(requestParams)
        );
    }

    private Map<String, String> vnpayResponse(String code, String message) {
        return Map.of(
                "RspCode", code,
                "Message", message
        );
    }
}
