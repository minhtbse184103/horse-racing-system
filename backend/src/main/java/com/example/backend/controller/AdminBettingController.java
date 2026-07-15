package com.example.backend.controller;

import com.example.backend.dto.request.CreateBetEventRequest;
import com.example.backend.dto.request.UpdateBetProductRequest;
import com.example.backend.dto.response.BetEventResponse;
import com.example.backend.dto.response.BetProductResponse;
import com.example.backend.dto.response.BetSettlementResponse;
import com.example.backend.service.BettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/betting")
@RequiredArgsConstructor
public class AdminBettingController {

    private final BettingService bettingService;

    @GetMapping("/products")
    public List<BetProductResponse> getProducts() {
        return bettingService.getProducts();
    }

    @PutMapping("/products/{productId}")
    public BetProductResponse updateProduct(
            @PathVariable Integer productId,
            @Valid @RequestBody UpdateBetProductRequest request
    ) {
        return bettingService.updateProduct(productId, request);
    }

    @GetMapping("/events")
    public List<BetEventResponse> getEvents() {
        return bettingService.getAdminEvents();
    }

    @PostMapping("/events")
    public ResponseEntity<BetEventResponse> createEvent(
            @Valid @RequestBody CreateBetEventRequest request,
            Authentication authentication
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bettingService.createEvent(request, authentication.getName()));
    }

    @PutMapping("/events/{eventId}/open")
    public BetEventResponse openEvent(@PathVariable Integer eventId) {
        return bettingService.openEvent(eventId);
    }

    @PutMapping("/events/{eventId}/close")
    public BetEventResponse closeEvent(@PathVariable Integer eventId) {
        return bettingService.closeEvent(eventId);
    }

    @PostMapping("/events/{eventId}/settle")
    public BetSettlementResponse settleEvent(
            @PathVariable Integer eventId,
            Authentication authentication
    ) {
        return bettingService.settleEvent(eventId, authentication.getName());
    }
}
