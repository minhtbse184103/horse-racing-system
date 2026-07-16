package com.example.backend.controller;

import com.example.backend.dto.request.RefereeRaceResultReviewRequest;
import com.example.backend.dto.response.RaceResultSubmissionDetailResponse;
import com.example.backend.dto.response.RaceResultSubmissionSummaryResponse;
import com.example.backend.service.RefereeRaceResultReviewService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/referee/race-result-submissions")
public class RefereeRaceResultReviewController {

    private final RefereeRaceResultReviewService reviewService;

    public RefereeRaceResultReviewController(
            RefereeRaceResultReviewService reviewService
    ) {
        this.reviewService = reviewService;
    }

    @GetMapping("/pending")
    public List<RaceResultSubmissionSummaryResponse> getPendingSubmissions(
            Authentication authentication
    ) {
        // FLOW: Referee Review Queue
        // ORDER: 4/7 - Controller uses authenticated referee identity and delegates queue filtering to service.
        // API: GET /api/referee/race-result-submissions/pending.
        // Purpose: list SUBMITTED provisional results assigned to this Referee.
        return reviewService.getPendingSubmissions(authentication.getName());
    }

    @GetMapping("/{submissionId}")
    public RaceResultSubmissionDetailResponse getSubmissionDetail(
            @PathVariable Integer submissionId,
            Authentication authentication
    ) {
        // FLOW: Referee Review Detail
        // ORDER: 3/8 - Controller receives detail request and keeps authenticated Referee identity attached.
        // Detail endpoint returns provisional entries and review history for assigned Referee.
        return reviewService.getSubmissionDetail(
                submissionId,
                authentication.getName()
        );
    }

    @PutMapping("/{submissionId}/confirm")
    public RaceResultSubmissionDetailResponse confirmSubmission(
            @PathVariable Integer submissionId,
            @Valid @RequestBody(required = false)
            RefereeRaceResultReviewRequest request,
            Authentication authentication
    ) {
        // FLOW: Referee Confirm Result
        // ORDER: 3/6 - Controller accepts confirm request and passes authenticated Referee to service.
        // Confirm endpoint records Referee acceptance without creating official RaceResult yet.
        return reviewService.confirmSubmission(
                submissionId,
                request,
                authentication.getName()
        );
    }

    @PutMapping("/{submissionId}/flag")
    public RaceResultSubmissionDetailResponse flagSubmission(
            @PathVariable Integer submissionId,
            @Valid @RequestBody RefereeRaceResultReviewRequest request,
            Authentication authentication
    ) {
        // FLOW: Referee Flag Result
        // ORDER: 4/6 - Controller accepts flag request and passes authenticated Referee to service.
        // Flag endpoint requires reason and records Referee concern before Admin review.
        return reviewService.flagSubmission(
                submissionId,
                request,
                authentication.getName()
        );
    }
}
