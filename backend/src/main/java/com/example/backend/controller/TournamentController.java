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

    @PostMapping("/program")
    public ResponseEntity<TournamentDetailResponse> createTournamentProgram(
            @Valid @RequestBody CreateTournamentProgramRequest request,
            Authentication authentication
    ) {
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
        return tournamentService.cancelTournament(
                tournamentId,
                authentication.getName()
        );
    }
}
