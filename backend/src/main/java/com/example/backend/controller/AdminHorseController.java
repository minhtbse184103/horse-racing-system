package com.example.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.request.AdminReviewFeedbackRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.service.AdminHorseService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/horses")
public class AdminHorseController {
    private final AdminHorseService adminHorseService;

    public AdminHorseController(AdminHorseService adminHorseService) {
        this.adminHorseService = adminHorseService;
    }

    @GetMapping("/pending")
    public List<HorseResponse> getPendingHorses() {
        return adminHorseService.getPendingHorses();
    }

    @PutMapping("/{horseId}/approve")
    public HorseResponse approveHorse(@PathVariable Integer horseId) {
        return adminHorseService.approveHorse(horseId);
    }

    @PutMapping("/{horseId}/reject")
    public HorseResponse rejectHorse(
            @PathVariable Integer horseId,
            @Valid @RequestBody AdminReviewFeedbackRequest request) {
        return adminHorseService.rejectHorse(horseId, request.getFeedback());
    }
}
