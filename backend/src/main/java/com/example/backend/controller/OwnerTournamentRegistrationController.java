package com.example.backend.controller;

import com.example.backend.dto.response.OwnerEntryFeeTransactionResponse;
import com.example.backend.dto.response.OwnerRegistrationPaymentResponse;
import com.example.backend.dto.response.OwnerRaceResponse;
import com.example.backend.dto.response.TournamentResponse;
import com.example.backend.service.OwnerTournamentRegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/owner/tournament-registrations")
@PreAuthorize("hasRole('OWNER')")
public class OwnerTournamentRegistrationController {

    private final OwnerTournamentRegistrationService registrationService;

    public OwnerTournamentRegistrationController(
            OwnerTournamentRegistrationService registrationService
    ) {
        this.registrationService = registrationService;
    }

    @GetMapping("/open-tournaments")
    public List<TournamentResponse> getOpenTournaments() {
        return registrationService.getOpenTournaments();
    }

    @GetMapping("/my-races")
    public List<OwnerRaceResponse> getMyRaces() {
        return registrationService.getMyRaces();
    }

    @GetMapping("/payment-transactions")
    public List<OwnerEntryFeeTransactionResponse> getPaymentTransactions() {
        return registrationService.getEntryFeeTransactions();
    }

    @PutMapping("/prize-distributions/{prizeDistributionId}/paid")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markPrizeDistributionPaid(
            @PathVariable Integer prizeDistributionId
    ) {
        registrationService.markOwnerPrizeDistributionPaid(prizeDistributionId);
    }

    @PostMapping("/{registrationId}/payment")
    public ResponseEntity<OwnerRegistrationPaymentResponse> startRegistrationPayment(
            @PathVariable Integer registrationId,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(registrationService.startRegistrationPayment(
                        registrationId,
                        getClientIp(httpRequest)
                ));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
