package com.example.backend.controller;

import com.example.backend.dto.request.CreateTournamentProgramRequest;
import com.example.backend.dto.request.UpdateTournamentRequest;
import com.example.backend.dto.response.TournamentDetailResponse;
import com.example.backend.dto.response.TournamentResponse;
import com.example.backend.service.TournamentProgramService;
import com.example.backend.service.TournamentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentController {

    private final TournamentService tournamentService;
    private final TournamentProgramService tournamentProgramService;

    public TournamentController(
            TournamentService tournamentService,
            TournamentProgramService tournamentProgramService
    ) {
        this.tournamentService = tournamentService;
        this.tournamentProgramService = tournamentProgramService;
    }

    @GetMapping
    public List<TournamentResponse> getAllTournaments() {
        return tournamentService.getAllTournaments();
    }

    @GetMapping("/{tournamentId}")
    public TournamentDetailResponse getTournamentById(
            @PathVariable Integer tournamentId
    ) {
        return tournamentService.getTournamentById(tournamentId);
    }

    @PostMapping(value = "/{tournamentId}/venue-image", consumes = "multipart/form-data")
    public TournamentDetailResponse uploadVenueImage(
            @PathVariable Integer tournamentId,
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        // FLOW: Admin Tournament Images
        // ORDER: 4V/7 - Backend controller receives venue multipart upload and delegates to TournamentService.
        // API: POST /api/tournaments/{id}/venue-image.
        // Purpose: receives the venue multipart file after Tournament create/edit and delegates Cloudinary storage to the service layer.
        return tournamentService.uploadVenueImage(
                tournamentId,
                file,
                authentication.getName()
        );
    }

    @DeleteMapping("/{tournamentId}/venue-image")
    public TournamentDetailResponse removeVenueImage(
            @PathVariable Integer tournamentId,
            Authentication authentication
    ) {
        // FLOW: Admin Tournament Images
        // ORDER: 4V/7 - Backend controller receives venue image removal and delegates to TournamentService.
        // API: DELETE /api/tournaments/{id}/venue-image.
        // Purpose: clears the venue image URL and removes the Cloudinary object.
        return tournamentService.removeVenueImage(
                tournamentId,
                authentication.getName()
        );
    }

    @PostMapping("/program")
    public ResponseEntity<TournamentDetailResponse> createTournamentProgram(
            @Valid @RequestBody CreateTournamentProgramRequest request,
            Authentication authentication
    ) {
        // FLOW: Admin Create Tournament Program
        // ORDER: 6/8 - Backend controller receives the atomic create request and delegates to TournamentProgramService.
        // API: POST /api/tournaments/program.
        // Purpose: entry point for the Admin wizard's atomic Tournament + Race program create flow.
        TournamentDetailResponse response =
                tournamentProgramService.createTournamentProgram(
                        request,
                        authentication.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{tournamentId}")
    public TournamentDetailResponse updateTournament(
            @PathVariable Integer tournamentId,
            @Valid @RequestBody UpdateTournamentRequest request,
            Authentication authentication
    ) {
        // FLOW: Admin Edit Tournament Program
        // ORDER: 5A/8 - Backend controller receives Tournament base-field update and delegates to TournamentService.
        // API: PUT /api/tournaments/{id}.
        // Purpose: updates Tournament base fields and Conditions before the frontend syncs Race changes.
        return tournamentService.updateTournament(
                tournamentId,
                request,
                authentication.getName()
        );
    }

    @PutMapping("/{tournamentId}/close-registration")
    public TournamentDetailResponse closeRegistration(
            @PathVariable Integer tournamentId,
            Authentication authentication
    ) {
        // FLOW: Admin Tournament Lifecycle
        // ORDER: 4CLOSE/5 - Backend controller receives close-registration request and delegates to TournamentService.
        // API: PUT /api/tournaments/{id}/close-registration.
        // Purpose: closes registration for the Tournament and its still-open Races.
        return tournamentService.closeRegistration(
                tournamentId,
                authentication.getName()
        );
    }

    @PutMapping("/{tournamentId}/complete")
    public TournamentDetailResponse completeTournament(
            @PathVariable Integer tournamentId,
            Authentication authentication
    ) {
        // FLOW: Admin Tournament Lifecycle
        // ORDER: 4COMPLETE/5 - Backend controller receives complete request and delegates to TournamentService.
        // API: PUT /api/tournaments/{id}/complete.
        // Purpose: finalizes the Tournament only after all child Races are completed.
        return tournamentService.completeTournament(
                tournamentId,
                authentication.getName()
        );
    }

    @DeleteMapping("/{tournamentId}")
    public TournamentDetailResponse cancelTournament(
            @PathVariable Integer tournamentId,
            Authentication authentication
    ) {
        // FLOW: Admin Tournament Lifecycle
        // ORDER: 5CANCEL/5 - Backend controller receives cancel request and delegates to TournamentService.
        // API: DELETE /api/tournaments/{id}.
        // Purpose: cancels an editable Tournament and cascades status cancellation to child Races.
        return tournamentService.cancelTournament(
                tournamentId,
                authentication.getName()
        );
    }
}
