package com.example.backend.controller;

import com.example.backend.dto.response.AdminTournamentWorkspaceResponse;
import com.example.backend.service.TournamentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tournaments")
public class AdminTournamentWorkspaceController {

    private final TournamentService tournamentService;

    public AdminTournamentWorkspaceController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @GetMapping("/workspace")
    public ResponseEntity<List<AdminTournamentWorkspaceResponse>> getWorkspace() {
        // FLOW: Admin Tournament Workspace Read
        // ORDER: 3/7 - Backend controller receives GET /workspace and delegates aggregate building to TournamentService.
        // API: GET /api/admin/tournaments/workspace.
        // Purpose: return the single aggregate payload used by the Admin Tournament workspace.
        return ResponseEntity.ok(tournamentService.getAdminTournamentWorkspace());
    }
}
