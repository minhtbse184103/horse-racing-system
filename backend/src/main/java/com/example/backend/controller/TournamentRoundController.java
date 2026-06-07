package com.example.backend.controller;

import com.example.backend.entity.TournamentRound;
import com.example.backend.service.TournamentRoundService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournament-rounds")
public class TournamentRoundController {
    private final TournamentRoundService tournamentRoundService;

    public TournamentRoundController(TournamentRoundService tournamentRoundService) {
        this.tournamentRoundService = tournamentRoundService;
    }

    @GetMapping("/by-tournament/{tournamentId}")
    public List<TournamentRound> getRoundsByTournamentId(
            @PathVariable Integer tournamentId
    ) {
        return tournamentRoundService.getRoundsByTournamentId(tournamentId);
    }

    @GetMapping("/{id}")
    public TournamentRound getRoundById(@PathVariable Integer id) {
        return tournamentRoundService.getRoundById(id);
    }
}