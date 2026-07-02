package com.example.backend.controller;

import com.example.backend.dto.request.AdminRaceResultReviewRequest;
import com.example.backend.dto.response.RaceResultSubmissionDetailResponse;
import com.example.backend.dto.response.RaceResultSubmissionSummaryResponse;
import com.example.backend.service.AdminRaceResultReviewService;
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
@RequestMapping("/api/admin/race-result-submissions")
public class AdminRaceResultReviewController {

    private final AdminRaceResultReviewService reviewService;

    public AdminRaceResultReviewController(
            AdminRaceResultReviewService reviewService
    ) {
        this.reviewService = reviewService;
    }

    @GetMapping("/review-queue")
    public List<RaceResultSubmissionSummaryResponse> getReviewQueue(
            Authentication authentication
    ) {
        return reviewService.getReviewQueue(authentication.getName());
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

    @PutMapping("/{submissionId}/approve")
    public RaceResultSubmissionDetailResponse approveSubmission(
            @PathVariable Integer submissionId,
            @Valid @RequestBody(required = false)
            AdminRaceResultReviewRequest request,
            Authentication authentication
    ) {
        return reviewService.approveSubmission(
                submissionId,
                request,
                authentication.getName()
        );
    }

    @PutMapping("/{submissionId}/reject")
    public RaceResultSubmissionDetailResponse rejectSubmission(
            @PathVariable Integer submissionId,
            @Valid @RequestBody AdminRaceResultReviewRequest request,
            Authentication authentication
    ) {
        return reviewService.rejectSubmission(
                submissionId,
                request,
                authentication.getName()
        );
    }
}
