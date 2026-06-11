package com.example.backend.controller;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.service.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import java.util.List;

@RestController
@RequestMapping("/api/races")
public class RaceController {

    private final RaceService raceService;

    public RaceController(RaceService raceService) {
        this.raceService = raceService;
    }

    @GetMapping("/by-tournament/{tournamentId}")
    public List<Race> getRacesByTournamentId(@PathVariable Integer tournamentId) {
        return raceService.getRacesByTournamentId(tournamentId);
    }
    @GetMapping("/by-round/{roundId}")
    public List<Race> getRacesByRoundId(@PathVariable Integer roundId) {
        return raceService.getRacesByRoundId(roundId);
    }

    @GetMapping
    public List<Race> getAllRaces() {
        return raceService.getAllRaces();
    }

    @GetMapping("/{id}")
    public Race getRaceById(@PathVariable Integer id) {
        return raceService.getRaceById(id);
    }

    @PostMapping
    public Race createRace(@Valid @RequestBody CreateRaceRequest request) {
        return raceService.createRace(request);
    }

    @PutMapping("/{id}")
public Race updateRace(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateRaceRequest request
) {
    return raceService.updateRace(id, request);
}

@DeleteMapping("/{id}")
public Race cancelRace(@PathVariable Integer id) {
    return raceService.cancelRace(id);
}
}
