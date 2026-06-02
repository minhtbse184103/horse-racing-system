package com.example.backend.controller;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.service.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import java.util.List;

@RestController
@RequestMapping("/api/race-rounds")
public class RaceRoundController {

    private final RaceRoundService raceRoundService;

    public RaceRoundController(RaceRoundService raceRoundService) {
        this.raceRoundService = raceRoundService;
    }

    @GetMapping
    public List<RaceRound> getAllRaceRounds() {
        return raceRoundService.getAllRaceRounds();
    }

    @GetMapping("/{id}")
    public RaceRound getRaceRoundById(@PathVariable Integer id) {
        return raceRoundService.getRaceRoundById(id);
    }

    @PostMapping
    public RaceRound createRaceRound(@Valid @RequestBody CreateRaceRoundRequest request) {
        return raceRoundService.createRaceRound(request);
    }

    @GetMapping("/by-race/{raceId}")
    public List<RaceRound> getRaceRoundsByRaceId(@PathVariable Integer raceId) {
        return raceRoundService.getRaceRoundsByRaceId(raceId);
    }

@PutMapping("/{id}")
public RaceRound updateRaceRound(
        @PathVariable Integer id,
        @Valid @RequestBody UpdateRaceRoundRequest request
) {
    return raceRoundService.updateRaceRound(id, request);
}
@DeleteMapping("/{id}")
public RaceRound cancelRaceRound(@PathVariable Integer id) {
    return raceRoundService.cancelRaceRound(id);
}
}
