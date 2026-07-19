package com.example.backend.controller;

import com.example.backend.dto.response.AdminMoneyTransactionResponse;
import com.example.backend.service.AdminMoneyTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/money-transactions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMoneyTransactionController {

    private final AdminMoneyTransactionService adminMoneyTransactionService;

    @GetMapping
    public List<AdminMoneyTransactionResponse> getTransactions(
            Authentication authentication,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to,
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) Integer tournamentId,
            @RequestParam(required = false) Integer limit
    ) {
        return adminMoneyTransactionService.getTransactions(
                authentication.getName(),
                source,
                type,
                status,
                from,
                to,
                userId,
                tournamentId,
                limit
        );
    }
}
