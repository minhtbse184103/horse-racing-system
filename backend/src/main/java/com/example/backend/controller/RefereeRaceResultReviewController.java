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
        return reviewService.getPendingSubmissions(authentication.getName());
    }

    @GetMapping("/{submissionId}")
    public RaceResultSubmissionDetailResponse getSubmissionDetail(
            @PathVariable Integer submissionId,
            Authentication authentication
    ) {
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
        return reviewService.flagSubmission(
                submissionId,
                request,
                authentication.getName()
        );
    }
}
