package com.example.backend.controller;

import com.example.backend.dto.request.CreateRaceRequest;
import com.example.backend.dto.request.FailRaceRunRequest;
import com.example.backend.dto.request.UpdateRaceRequest;
import com.example.backend.dto.response.RaceLaunchResponse;
import com.example.backend.dto.response.RaceResponse;
import com.example.backend.dto.response.RaceResultPrizeResponse;
import com.example.backend.dto.response.RaceRunRecoveryResponse;
import com.example.backend.service.RaceEngineLaunchService;
import com.example.backend.service.RaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @GetMapping("/{raceId}/results")
    public List<RaceResultPrizeResponse> getRaceResults(
            @PathVariable Integer raceId
    ) {
        // FLOW: Official Result Display
        // ORDER: 3/7 - Controller receives the dialog request and delegates official result lookup.
        // Results endpoint exposes official RaceResult rows, not provisional RaceResultSubmission rows.
        return raceService.getRaceResults(raceId);
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 5B/8 - Backend controller receives newly added Race create request from edit synchronization.
        // API: POST /api/races.
        // Purpose: creates a newly added Race under an existing Tournament during edit sync.
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 5C/8 - Backend controller receives existing Race update request from edit synchronization.
        // API: PUT /api/races/{id}.
        // Purpose: updates a persisted Race and replaces its prize rules during edit sync.
        return raceService.updateRace(raceId, request, authentication.getName());
    }

    @PostMapping(value = "/{raceId}/track-image", consumes = "multipart/form-data")
    public RaceResponse uploadTrackImage(
            @PathVariable Integer raceId,
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        // FLOW: Admin Tournament Images
        // ORDER: 4R/7 - Backend controller receives Race track multipart upload and delegates to RaceService.
        // API: POST /api/races/{id}/track-image.
        // Purpose: receives the Race track multipart file after Race create/update and delegates Cloudinary storage to the service layer.
        return raceService.uploadTrackImage(
                raceId,
                file,
                authentication.getName()
        );
    }

    @DeleteMapping("/{raceId}/track-image")
    public RaceResponse removeTrackImage(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        // FLOW: Admin Tournament Images
        // ORDER: 4R/7 - Backend controller receives Race track image removal and delegates to RaceService.
        // API: DELETE /api/races/{id}/track-image.
        // Purpose: clears the Race track image URL and removes the Cloudinary object.
        return raceService.removeTrackImage(raceId, authentication.getName());
    }

    @PutMapping("/{raceId}/close-registration")
    public RaceResponse closeRegistration(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        return raceService.closeRegistration(raceId, authentication.getName());
    }

    @PutMapping("/{raceId}/finalize-entries")
    public RaceResponse finalizeRaceEntries(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        // FLOW: Admin Finalize RaceEntry
        // ORDER: 3/6 - Controller delegates RaceEntry finalization validation and DB update to RaceService.
        // API: PUT /api/races/{raceId}/finalize-entries.
        // Purpose: locks the official RaceEntry list before the Race can later be marked READY.
        return raceService.finalizeRaceEntries(
                raceId,
                authentication.getName()
        );
    }

    @PutMapping("/{raceId}/ready")
    public RaceResponse markRaceReady(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        // FLOW: Admin Mark Race READY
        // ORDER: 4/6 - Controller delegates READY transition validation and DB update to RaceService.
        // API: PUT /api/races/{raceId}/ready.
        // Purpose: validates Race launch prerequisites and moves the Race into READY state for Unity launch.
        return raceService.markRaceReady(raceId, authentication.getName());
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
        // FLOW: Admin Launch Unity Race
        // ORDER: 4/9 - Controller delegates launch validation, token creation, status update, and Unity start to service.
        // API: POST /api/races/{raceId}/run.
        // Purpose: launches Unity for a READY Race and returns the backend-owned race engine token/status.
        return raceEngineLaunchService.launchRace(raceId, authentication.getName());
    }

    @PutMapping("/{raceId}/run/fail")
    public RaceRunRecoveryResponse failRaceRun(
            @PathVariable Integer raceId,
            @Valid @RequestBody FailRaceRunRequest request,
            Authentication authentication
    ) {
        // FLOW: Admin Fail Running Race
        // ORDER: 5/7 - Controller receives the fail request and delegates recovery rules to RaceEngineLaunchService.
        // API: PUT /api/races/{raceId}/run/fail.
        // Purpose: admin recovery endpoint when Unity/live run is stuck before result submission.
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 5D/8 - Backend controller receives Race cancellation request for a Race removed from the edit wizard.
        // API: DELETE /api/races/{id}.
        // Purpose: cancels a Race removed from the edit wizard; RaceEntry history blocks cancellation.
        return raceService.cancelRace(raceId, authentication.getName());
    }
}
