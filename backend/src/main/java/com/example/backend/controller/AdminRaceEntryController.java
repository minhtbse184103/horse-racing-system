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
        return raceEntryService.getAssignmentQueue();
    }

    @GetMapping("/assignment-queue/by-tournament/{tournamentId}")
    public List<RaceEntryCandidateResponse>
    getAssignmentQueueByTournament(
            @PathVariable Integer tournamentId
    ) {
        return raceEntryService
                .getAssignmentQueueByTournament(tournamentId);
    }

    @GetMapping("/by-race/{raceId}")
    public List<RaceEntryResponse> getEntriesByRace(
            @PathVariable Integer raceId
    ) {
        return raceEntryService.getEntriesByRace(raceId);
    }

    @PostMapping
    public ResponseEntity<RaceEntryResponse> assignRegistration(
            @Valid @RequestBody CreateRaceEntryRequest request,
            Authentication authentication
    ) {
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
        return ResponseEntity.ok(
                raceEntryService.cancelEntry(
                        raceEntryId,
                        request,
                        authentication.getName()
                )
        );
    }
}