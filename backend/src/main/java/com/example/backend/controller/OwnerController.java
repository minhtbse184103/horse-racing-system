package com.example.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.OwnerService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/owner/horses")
@Tag(name = "Owner - Horse Management", description = "APIs for horse owners to manage their horses")
@PreAuthorize("hasRole('OWNER')")
public class OwnerController {
    @Autowired
    private OwnerService ownerService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a new horse
     */
    @PostMapping
    public ResponseEntity<HorseResponse> createHorse(
            @Valid @RequestBody CreateHorseRequest request,
            Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HorseResponse response = ownerService.createHorse(owner, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all horses owned by the current user
     */
    @GetMapping
    public ResponseEntity<List<HorseResponse>> getMyHorses(Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<HorseResponse> horses = ownerService.getOwnerHorses(owner);
        return ResponseEntity.ok(horses);
    }

    /**
     * Get a specific horse
     */
    @GetMapping("/{horseID}")
    public ResponseEntity<HorseResponse> getHorse(
            @PathVariable Integer horseID,
            Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HorseResponse horse = ownerService.getHorse(horseID, owner);
        return ResponseEntity.ok(horse);
    }

    /**
     * Update a horse
     */
    @PutMapping("/{horseID}")
    public ResponseEntity<HorseResponse> updateHorse(
            @PathVariable Integer horseID,
            @RequestBody UpdateHorseRequest request,
            Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HorseResponse horse = ownerService.updateHorse(horseID, owner, request);
        return ResponseEntity.ok(horse);
    }

    /**
     * Delete a horse
     */
    @DeleteMapping("/{horseID}")
    public ResponseEntity<Void> deleteHorse(
            @PathVariable Integer horseID,
            Principal principal) {
        User owner = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        ownerService.deleteHorse(horseID, owner);
        return ResponseEntity.noContent().build();
    }
}
