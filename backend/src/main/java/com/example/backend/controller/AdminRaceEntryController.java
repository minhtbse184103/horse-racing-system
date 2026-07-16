package com.example.backend.controller;

import com.example.backend.dto.request.CreateRaceEntryRequest;
import com.example.backend.dto.response.RaceEntryCandidateResponse;
import com.example.backend.dto.response.RaceEntryResponse;
import com.example.backend.dto.request.CancelRaceEntryRequest;
import com.example.backend.service.RaceEntryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/race-entries")
public class AdminRaceEntryController {

    private final RaceEntryService raceEntryService;

    public AdminRaceEntryController(
            RaceEntryService raceEntryService
    ) {
        this.raceEntryService = raceEntryService;
    }

    @GetMapping("/assignment-queue")
    public List<RaceEntryCandidateResponse> getAssignmentQueue() {
        // FLOW: Admin RaceEntry Assignment Queue Load
        // ORDER: 5GLOBAL/7 - Controller exposes the global candidate queue and delegates eligibility to RaceEntryService.
        // API: GET /api/admin/race-entries/assignment-queue.
        // Purpose: returns APPROVED + PAID Registration candidates that are not actively assigned to a Race.
        return raceEntryService.getAssignmentQueue();
    }

    @GetMapping("/assignment-queue/by-tournament/{tournamentId}")
    public List<RaceEntryCandidateResponse>
    getAssignmentQueueByTournament(
            @PathVariable Integer tournamentId
    ) {
        // FLOW: Admin RaceEntry Assignment Queue Load
        // ORDER: 5TOURNAMENT/7 - Controller exposes the Tournament-scoped candidate queue for the expanded workspace.
        // API: GET /api/admin/race-entries/assignment-queue/by-tournament/{tournamentId}.
        // Purpose: returns the same eligible candidates but scoped to the expanded Tournament workspace.
        return raceEntryService
                .getAssignmentQueueByTournament(tournamentId);
    }

    @GetMapping("/by-race/{raceId}")
    public List<RaceEntryResponse> getEntriesByRace(
            @PathVariable Integer raceId
    ) {
        // FLOW: Admin Assigned RaceEntry Load
        // ORDER: 5/6 - Controller exposes by-race official entries and delegates ASSIGNED filtering to RaceEntryService.
        // API: GET /api/admin/race-entries/by-race/{raceId}.
        // Purpose: returns active ASSIGNED RaceEntry rows for the selected Race in stall order.
        return raceEntryService.getEntriesByRace(raceId);
    }

    @PostMapping
    public ResponseEntity<RaceEntryResponse> assignRegistration(
            @Valid @RequestBody CreateRaceEntryRequest request,
            Authentication authentication
    ) {
        // FLOW: Admin Assign RaceEntry
        // ORDER: 4/8 - Controller accepts create request, reads authenticated Admin email, and delegates to RaceEntryService.
        // API: POST /api/admin/race-entries.
        // Purpose: assigns an APPROVED + PAID Registration to a Race; backend owns random startingStall/audit fields.
        RaceEntryResponse response =
                raceEntryService.assignRegistration(
                        request,
                        authentication.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
    @PutMapping("/{raceEntryId}/cancel")
    public ResponseEntity<RaceEntryResponse> cancelRaceEntry(
            @PathVariable Integer raceEntryId,
            @Valid @RequestBody CancelRaceEntryRequest request,
            Authentication authentication
    ) {
        // FLOW: Admin Cancel RaceEntry
        // ORDER: 5/6 - Controller receives cancellation reason and delegates status/audit change to RaceEntryService.
        // API: PUT /api/admin/race-entries/{raceEntryId}/cancel.
        // Purpose: marks an active RaceEntry as CANCELLED with reason; history remains for audit.
        return ResponseEntity.ok(
                raceEntryService.cancelEntry(
                        raceEntryId,
                        request,
                        authentication.getName()
                )
        );
    }
}
