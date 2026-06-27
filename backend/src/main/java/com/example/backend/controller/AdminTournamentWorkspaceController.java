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
        return ResponseEntity.ok(tournamentService.getAdminTournamentWorkspace());
    }
}
