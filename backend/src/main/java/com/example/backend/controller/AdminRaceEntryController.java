package com.example.backend.controller;

import com.example.backend.dto.request.CreateRaceEntryRequest;
import com.example.backend.entity.RaceEntry;
import com.example.backend.service.RaceEntryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/race-entries")
public class AdminRaceEntryController {

    private final RaceEntryService raceEntryService;

    public AdminRaceEntryController(RaceEntryService raceEntryService) {
        this.raceEntryService = raceEntryService;
    }

    @PostMapping
    public ResponseEntity<RaceEntry> createRaceEntry(
            @Valid @RequestBody CreateRaceEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(raceEntryService.createRaceEntry(request));
    }
}
