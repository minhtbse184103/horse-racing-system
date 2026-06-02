package com.example.backend.controller;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.service.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/race-categories")
public class RaceCategoryController {

    private final RaceCategoryService raceCategoryService;

    public RaceCategoryController(RaceCategoryService raceCategoryService) {
        this.raceCategoryService = raceCategoryService;
    }

    @GetMapping
    public List<RaceCategory> getAllRaceCategories() {
        return raceCategoryService.getAllRaceCategories();
    }

    @GetMapping("/{id}")
    public RaceCategory getRaceCategoryById(@PathVariable Integer id) {
        return raceCategoryService.getRaceCategoryById(id);
    }
}
