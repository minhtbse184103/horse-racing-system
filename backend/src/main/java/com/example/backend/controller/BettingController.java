package com.example.backend.controller;

import com.example.backend.dto.request.PlaceBetRequest;
import com.example.backend.dto.response.BetEventResponse;
import com.example.backend.dto.response.BetProductResponse;
import com.example.backend.dto.response.BetTicketResponse;
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
@RequestMapping("/api/betting")
@RequiredArgsConstructor
public class BettingController {

    private final BettingService bettingService;

    @GetMapping("/products")
    public List<BetProductResponse> getProducts() {
        return bettingService.getProducts();
    }

    @GetMapping("/events")
    public List<BetEventResponse> getOpenEvents() {
        return bettingService.getOpenEvents();
    }

    @GetMapping("/events/{eventId}")
    public BetEventResponse getEvent(@PathVariable Integer eventId) {
        return bettingService.getEvent(eventId);
    }

    @PostMapping("/events/{eventId}/tickets")
    public ResponseEntity<BetTicketResponse> placeBet(
            @PathVariable Integer eventId,
            @Valid @RequestBody PlaceBetRequest request,
            Authentication authentication
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bettingService.placeBet(eventId, request, authentication.getName()));
    }

    @GetMapping("/my-tickets")
    public List<BetTicketResponse> getMyTickets(Authentication authentication) {
        return bettingService.getMyTickets(authentication.getName());
    }

    @PutMapping("/tickets/{ticketId}/cancel")
    public BetTicketResponse cancelTicket(
            @PathVariable Integer ticketId,
            Authentication authentication
    ) {
        return bettingService.cancelTicket(ticketId, authentication.getName());
    }
}
