package com.example.backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.OwnerDashboardResponse;
import com.example.backend.service.OwnerService;

@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasRole('OWNER')")
public class OwnerController {
    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    // Lấy thông tin tổng quan dashboard của owner đang đăng nhập.
    @GetMapping("/dashboard")
    public OwnerDashboardResponse getDashboard() {
        return ownerService.getDashboard();
    }
}
