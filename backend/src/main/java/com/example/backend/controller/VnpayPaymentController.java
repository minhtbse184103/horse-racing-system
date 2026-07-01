package com.example.backend.controller;

import com.example.backend.dto.response.VnpayPaymentResultResponse;
import com.example.backend.service.VnpayPaymentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
public class VnpayPaymentController {

    private final VnpayPaymentService vnpayPaymentService;

    public VnpayPaymentController(VnpayPaymentService vnpayPaymentService) {
        this.vnpayPaymentService = vnpayPaymentService;
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
    public VnpayPaymentResultResponse handleReturn(
            @RequestParam Map<String, String> requestParams
    ) {
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
