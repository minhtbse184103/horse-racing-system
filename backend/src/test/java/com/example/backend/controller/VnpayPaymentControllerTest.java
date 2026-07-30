package com.example.backend.controller;

import com.example.backend.dto.response.VnpayPaymentResultResponse;
import com.example.backend.service.VnpayPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class VnpayPaymentControllerTest {

    @Test
    void browserReturnRedirectsToFrontendWithOriginalQuery() {
        VnpayPaymentService paymentService = mock(VnpayPaymentService.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getQueryString()).thenReturn(
                "vnp_TxnRef=REG-23-ABC&vnp_ResponseCode=00&vnp_SecureHash=hash"
        );
        VnpayPaymentController controller = new VnpayPaymentController(
                paymentService,
                "http://localhost:5173/"
        );

        ResponseEntity<Void> response = controller.handleReturn(request);

        assertEquals(HttpStatus.FOUND, response.getStatusCode());
        assertEquals(
                "http://localhost:5173?vnp_TxnRef=REG-23-ABC&vnp_ResponseCode=00&vnp_SecureHash=hash",
                response.getHeaders().getLocation().toString()
        );
        verifyNoInteractions(paymentService);
    }

    @Test
    void confirmReturnProcessesCallbackAndReturnsJsonResult() {
        VnpayPaymentService paymentService = mock(VnpayPaymentService.class);
        VnpayPaymentController controller = new VnpayPaymentController(
                paymentService,
                "http://localhost:5173"
        );
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "REG-23-ABC",
                "vnp_ResponseCode", "00"
        );
        VnpayPaymentResultResponse expected = VnpayPaymentResultResponse.builder()
                .validSignature(true)
                .success(true)
                .txnRef("REG-23-ABC")
                .build();
        when(paymentService.processVnpayCallback(params)).thenReturn(expected);

        VnpayPaymentResultResponse result = controller.confirmReturn(params);

        assertSame(expected, result);
        verify(paymentService).processVnpayCallback(params);
    }
}
