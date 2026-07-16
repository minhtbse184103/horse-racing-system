package com.example.backend.controller;

import com.example.backend.dto.request.CreateRefereeAssignmentRequest;
import com.example.backend.dto.response.AdminAssignableRaceResponse;
import com.example.backend.dto.response.RefereeAssignmentResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.service.RaceService;
import com.example.backend.service.RefereeAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/referee-assignments")
public class AdminRefereeAssignmentController {

    private final RefereeAssignmentService assignmentService;
    private final RaceService raceService;

    public AdminRefereeAssignmentController(
            RefereeAssignmentService assignmentService,
            RaceService raceService
    ) {
        this.assignmentService = assignmentService;
        this.raceService = raceService;
    }

    @PostMapping
    public ResponseEntity<RefereeAssignmentResponse> createAssignment(
            @Valid @RequestBody CreateRefereeAssignmentRequest request,
            Authentication authentication
    ) {
        // FLOW: Admin Create Referee Assignment
        // ORDER: 4/6 - Controller receives the create request and delegates all business validation to RefereeAssignmentService.
        // API: POST /api/admin/referee-assignments.
        // Purpose: creates one Race -> Referee assignment after service-level role, status, duplicate, and schedule checks.
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(assignmentService.createAssignment(
                        request,
                        authentication.getName()
                ));
    }

    @PutMapping("/{raceId}/referee/{refereeUserId}")
    public RefereeAssignmentResponse replaceAssignment(
            @PathVariable Integer raceId,
            @PathVariable Integer refereeUserId,
            Authentication authentication
    ) {
        // FLOW: Admin Replace Referee
        // ORDER: 4/6 - Controller receives replace request and delegates role/status/conflict checks to the service.
        // API: PUT /api/admin/referee-assignments/{raceId}/referee/{refereeUserId}.
        // Purpose: replaces the Referee assigned to a Race, or creates the assignment if the row is missing.
        return assignmentService.replaceAssignment(
                raceId,
                refereeUserId,
                authentication.getName()
        );
    }

    @DeleteMapping("/{raceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAssignment(
            @PathVariable Integer raceId,
            Authentication authentication
    ) {
        // FLOW: Admin Remove Referee Assignment
        // ORDER: 5/6 - Controller receives delete request and delegates Race/admin validation to the service.
        // API: DELETE /api/admin/referee-assignments/{raceId}.
        // Purpose: deletes the current RefereeAssignment row after service-level Race/admin validation.
        assignmentService.removeAssignment(raceId, authentication.getName());
    }

    @GetMapping
    public List<RefereeAssignmentResponse> getAllAssignments() {
        // FLOW: Admin Referee Assignment Page Data Load
        // ORDER: 3A/7 - Controller exposes current assignment rows to the Admin page.
        // API: GET /api/admin/referee-assignments.
        // Purpose: returns current Race -> Referee assignment rows for the assignment list.
        return assignmentService.getAllAssignments();
    }

    @GetMapping("/by-race/{raceId}")
    public RefereeAssignmentResponse getByRaceId(
            @PathVariable Integer raceId
    ) {
        return assignmentService.getByRaceId(raceId);
    }

    @GetMapping("/referees")
    public List<UserResponse> getActiveReferees() {
        // FLOW: Admin Referee Assignment Page Data Load
        // ORDER: 3B/7 - Controller exposes ACTIVE REFEREE options to the Admin page.
        // API: GET /api/admin/referee-assignments/referees.
        // Purpose: returns ACTIVE REFEREE users for assignment selection.
        return assignmentService.getActiveReferees();
    }

    @GetMapping("/assignable-races")
    public List<AdminAssignableRaceResponse> getAssignableRaces() {
        // FLOW: Admin Referee Assignment Page Data Load
        // ORDER: 3C/7 - Controller exposes assignable Race options to the Admin page.
        // API: GET /api/admin/referee-assignments/assignable-races.
        // Purpose: returns Race options whose status can accept a Referee assignment.
        return raceService.getAssignableRaces();
    }
}
