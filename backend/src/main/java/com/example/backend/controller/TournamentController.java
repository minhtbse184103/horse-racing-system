package com.example.backend.controller;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.service.*;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentController {

    private final TournamentService tournamentService;

    public TournamentController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @GetMapping("/{id}")
    public Tournament getTournamentById(@PathVariable Integer id) {
        return tournamentService.getTournamentById(id);
    }

    @GetMapping
    public List<Tournament> getAllTournaments() {
        return tournamentService.getAllTournaments();
    }

    @PostMapping
    public Tournament createTournament(
            @Valid @RequestBody CreateTournamentRequest request,
            Authentication authentication) {
        return tournamentService.createTournament(request, authentication.getName());
    }

    @PutMapping("/{id}")
public Tournament updateTournament(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateTournamentRequest request
) {
    return tournamentService.updateTournament(id, request);
}
@PutMapping("/{id}/open-registration")
public Tournament openRegistration(@PathVariable Integer id) {
    return tournamentService.openRegistration(id);
}
@DeleteMapping("/{id}")
public Tournament cancelTournament(@PathVariable Integer id) {
    return tournamentService.cancelTournament(id);
}
}
