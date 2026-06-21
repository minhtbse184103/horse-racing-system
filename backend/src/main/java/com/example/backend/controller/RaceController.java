package com.example.backend.controller;

import com.example.backend.dto.request.CreateRaceRequest;
import com.example.backend.dto.request.UpdateRaceRequest;
import com.example.backend.dto.response.RaceResponse;
import com.example.backend.service.RaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
public class RaceController {

    private final RaceService raceService;

    public RaceController(RaceService raceService) {
        this.raceService = raceService;
    }

    @GetMapping
    public List<RaceResponse> getAllRaces() {
        return raceService.getAllRaces();
    }

    @GetMapping("/{raceId}")
    public RaceResponse getRaceById(
            @PathVariable Integer raceId
    ) {
        return raceService.getRaceById(raceId);
    }

    @GetMapping("/by-tournament/{tournamentId}")
    public List<RaceResponse> getRacesByTournamentId(
            @PathVariable Integer tournamentId
    ) {
        return raceService.getRacesByTournamentId(tournamentId);
    }

    @PostMapping
    public ResponseEntity<RaceResponse> createRace(
            @Valid @RequestBody CreateRaceRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(raceService.createRace(request));
    }

    @PutMapping("/{raceId}")
    public RaceResponse updateRace(
            @PathVariable Integer raceId,
            @Valid @RequestBody UpdateRaceRequest request
    ) {
        return raceService.updateRace(raceId, request);
    }

    @PutMapping("/{raceId}/close-registration")
    public RaceResponse closeRegistration(
            @PathVariable Integer raceId
    ) {
        return raceService.closeRegistration(raceId);
    }

    @PutMapping("/{raceId}/complete")
    public RaceResponse completeRace(
            @PathVariable Integer raceId
    ) {
        return raceService.completeRace(raceId);
    }

    @DeleteMapping("/{raceId}")
    public RaceResponse cancelRace(
            @PathVariable Integer raceId
    ) {
        return raceService.cancelRace(raceId);
    }
}