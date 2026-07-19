package com.example.backend.controller;

import com.example.backend.dto.response.AdminSystemWalletResponse;
import com.example.backend.service.AdminSystemWalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/system-wallet")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSystemWalletController {

    private final AdminSystemWalletService adminSystemWalletService;

    @GetMapping
    public AdminSystemWalletResponse getSystemWallet(Authentication authentication) {
        return adminSystemWalletService.getSystemWallet(authentication.getName());
    }
}
