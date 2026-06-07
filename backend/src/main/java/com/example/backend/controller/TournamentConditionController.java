package com.example.backend.controller;

import com.example.backend.entity.TournamentCondition;
import com.example.backend.service.TournamentConditionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournament-conditions")
public class TournamentConditionController {
    private final TournamentConditionService service;

    public TournamentConditionController(TournamentConditionService service) {
        this.service = service;
    }

    @GetMapping
    public List<TournamentCondition> getAllConditions() {
        return service.getAllConditions();
    }

    @GetMapping("/{id}")
    public TournamentCondition getConditionById(@PathVariable Integer id) {
        return service.getConditionById(id);
    }
}