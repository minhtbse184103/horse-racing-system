package com.example.backend.controller;

import com.example.backend.dto.request.CreateRaceRequest;
import com.example.backend.dto.request.FailRaceRunRequest;
import com.example.backend.dto.request.UpdateRaceRequest;
import com.example.backend.dto.response.RaceLaunchResponse;
import com.example.backend.dto.response.RaceResponse;
import com.example.backend.dto.response.RaceRunRecoveryResponse;
import com.example.backend.service.RaceEngineLaunchService;
import com.example.backend.service.RaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
public class RaceController {

    private final RaceService raceService;
    private final RaceEngineLaunchService raceEngineLaunchService;

    public RaceController(
            RaceService raceService,
            RaceEngineLaunchService raceEngineLaunchService
    ) {
        this.raceService = raceService;
        this.raceEngineLaunchService = raceEngineLaunchService;
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
            @Valid @RequestBody CreateRaceRequest request,
            Authentication authentication
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(raceService.createRace(request, authentication.getName()));
    }

    @PutMapping("/{raceId}")
    public RaceResponse updateRace(
            @PathVariable Integer raceId,
            @Valid @RequestBody UpdateRaceRequest request,
            Authentication authentication
    ) {
        return raceService.updateRace(raceId, request, authentication.getName());
    }

    @PutMapping("/{raceId}/close-registration")
    public RaceResponse closeRegistration(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        return raceService.closeRegistration(raceId, authentication.getName());
    }

    @PutMapping("/{raceId}/complete")
    public RaceResponse completeRace(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        return raceService.completeRace(raceId, authentication.getName());
    }

    @PostMapping("/{raceId}/run")
    public RaceLaunchResponse runRace(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        return raceEngineLaunchService.launchRace(raceId, authentication.getName());
    }

    @PutMapping("/{raceId}/run/fail")
    public RaceRunRecoveryResponse failRaceRun(
            @PathVariable Integer raceId,
            @Valid @RequestBody FailRaceRunRequest request,
            Authentication authentication
    ) {
        return raceEngineLaunchService.failLaunchedRace(
                raceId,
                request,
                authentication.getName()
        );
    }

    @DeleteMapping("/{raceId}")
    public RaceResponse cancelRace(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        return raceService.cancelRace(raceId, authentication.getName());
    }
}
