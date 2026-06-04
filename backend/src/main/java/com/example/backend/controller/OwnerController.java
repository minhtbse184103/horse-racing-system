package com.example.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.dto.response.OwnerDashboardResponse;
import com.example.backend.service.OwnerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasRole('OWNER')")
public class OwnerController {
    private final OwnerService ownerService;

    public OwnerController(OwnerService ownerService) {
        this.ownerService = ownerService;
    }

    @GetMapping("/dashboard")
    public OwnerDashboardResponse getDashboard() {
        return ownerService.getDashboard();
    }

    @GetMapping("/horses")
    public List<HorseResponse> getMyHorses() {
        return ownerService.getMyHorses();
    }

    @GetMapping("/horses/{horseId}")
    public HorseResponse getMyHorseById(@PathVariable Integer horseId) {
        return ownerService.getMyHorseById(horseId);
    }

    @PostMapping("/horses")
    public ResponseEntity<HorseResponse> createHorse(@Valid @RequestBody CreateHorseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ownerService.createHorse(request));
    }

    @PutMapping("/horses/{horseId}")
    public HorseResponse updateHorse(
            @PathVariable Integer horseId,
            @Valid @RequestBody UpdateHorseRequest request) {
        return ownerService.updateHorse(horseId, request);
    }

    @DeleteMapping("/horses/{horseId}")
    public ResponseEntity<Void> deleteHorse(@PathVariable Integer horseId) {
        ownerService.deleteHorse(horseId);
        return ResponseEntity.noContent().build();
    }
}
