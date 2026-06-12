package com.example.backend.controller;

import com.example.backend.dto.request.CreateRefereeAssignmentRequest;
import com.example.backend.dto.response.RefereeAssignmentResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.RefereeAssignment;
import com.example.backend.service.RefereeAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/referee-assignments")
public class AdminRefereeAssignmentController {

    private final RefereeAssignmentService assignmentService;

    public AdminRefereeAssignmentController(
            RefereeAssignmentService assignmentService
    ) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    public ResponseEntity<RefereeAssignment> createAssignment(
            @Valid @RequestBody CreateRefereeAssignmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.createAssignment(request));
    }

    @PutMapping("/{raceId}/referee/{refereeUserId}")
    public RefereeAssignment replaceAssignment(
            @PathVariable Integer raceId,
            @PathVariable Integer refereeUserId
    ) {
        return assignmentService.replaceAssignment(raceId, refereeUserId);
    }

    @DeleteMapping("/{raceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAssignment(@PathVariable Integer raceId) {
        assignmentService.removeAssignment(raceId);
    }

    @GetMapping
    public List<RefereeAssignmentResponse> getAllAssignments() {
        return assignmentService.getAllAssignments();
    }

    @GetMapping("/by-race/{raceId}")
    public RefereeAssignmentResponse getByRaceId(@PathVariable Integer raceId) {
        return assignmentService.getByRaceId(raceId);
    }

    @GetMapping("/referees")
    public List<UserResponse> getActiveReferees() {
        return assignmentService.getActiveReferees();
    }
}
