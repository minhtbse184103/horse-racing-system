package com.example.backend.controller;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.request.WalletDepositRequest;
import com.example.backend.dto.response.WalletDepositResponse;
import com.example.backend.dto.response.WalletResponse;
import com.example.backend.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallet", description = "API quản lý ví người dùng")
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SPECTATOR', 'JOCKEY')")
    @Operation(summary = "Xem số dư ví của người dùng hiện tại")
    public ResponseEntity<ApiResponse<WalletResponse>> getMyWallet(
            Authentication authentication
    ) {
        WalletResponse response = walletService.getMyWallet(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<WalletResponse>builder()
                .status(true)
                .message("Lấy thông tin ví thành công.")
                .data(response)
                .build());
    }

    @PostMapping("/me/deposits")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SPECTATOR', 'JOCKEY')")
    @Operation(summary = "Tạo thanh toán VNPAY để nạp tiền vào ví")
    public ResponseEntity<ApiResponse<WalletDepositResponse>> createDepositPayment(
            Authentication authentication,
            @Valid @RequestBody WalletDepositRequest request,
            HttpServletRequest httpServletRequest
    ) {
        WalletDepositResponse response = walletService.createDepositPayment(
                authentication.getName(),
                request,
                httpServletRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(ApiResponse.<WalletDepositResponse>builder()
                .status(true)
                .message("Tạo giao dịch nạp tiền thành công.")
                .data(response)
                .build());
    }
}
