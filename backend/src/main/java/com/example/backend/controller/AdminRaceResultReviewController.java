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
        // FLOW: Admin Result Review Queue
        // ORDER: 3/6 - Controller uses authenticated admin identity and delegates queue status filtering.
        // Queue endpoint exposes referee-reviewed provisional results for Admin final decision.
        return reviewService.getReviewQueue(authentication.getName());
    }

    @GetMapping("/{submissionId}")
    public RaceResultSubmissionDetailResponse getSubmissionDetail(
            @PathVariable Integer submissionId,
            Authentication authentication
    ) {
        // FLOW: Admin Result Review Detail
        // ORDER: 3/8 - Controller receives admin detail request and forwards authenticated admin identity.
        // Detail endpoint returns provisional entries and review history for Admin decision.
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
        // FLOW: Admin Approve Result
        // ORDER: 3/9 - Controller receives approval request and passes authenticated admin identity.
        // Approve endpoint finalizes provisional result into official result/prize data.
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
        // FLOW: Admin Reject Result
        // ORDER: 4/8 - Controller receives reject request and forwards authenticated admin identity.
        // Reject endpoint records the reason and returns the Race to READY for a new Unity run.
        return reviewService.rejectSubmission(
                submissionId,
                request,
                authentication.getName()
        );
    }
}
