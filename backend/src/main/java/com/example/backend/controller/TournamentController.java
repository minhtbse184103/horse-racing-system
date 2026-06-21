package com.example.backend.controller;

import com.example.backend.dto.request.CreateTournamentRequest;
import com.example.backend.dto.request.UpdateTournamentRequest;
import com.example.backend.dto.response.TournamentDetailResponse;
import com.example.backend.dto.response.TournamentResponse;
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

    public TournamentController(
            TournamentService tournamentService
    ) {
        this.tournamentService = tournamentService;
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
        return tournamentService.removeVenueImage(
                tournamentId,
                authentication.getName()
        );
    }

    @PostMapping
    public ResponseEntity<TournamentDetailResponse> createTournament(
            @Valid @RequestBody CreateTournamentRequest request,
            Authentication authentication
    ) {
        TournamentDetailResponse response =
                tournamentService.createTournament(
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
            @Valid @RequestBody UpdateTournamentRequest request
    ) {
        return tournamentService.updateTournament(
                tournamentId,
                request
        );
    }

    @PutMapping("/{tournamentId}/close-registration")
    public TournamentDetailResponse closeRegistration(
            @PathVariable Integer tournamentId
    ) {
        return tournamentService.closeRegistration(tournamentId);
    }

    @PutMapping("/{tournamentId}/complete")
    public TournamentDetailResponse completeTournament(
            @PathVariable Integer tournamentId
    ) {
        return tournamentService.completeTournament(tournamentId);
    }

    @DeleteMapping("/{tournamentId}")
    public TournamentDetailResponse cancelTournament(
            @PathVariable Integer tournamentId
    ) {
        return tournamentService.cancelTournament(tournamentId);
    }
}
