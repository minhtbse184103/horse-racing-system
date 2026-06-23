package com.example.backend.controller;

import com.example.backend.dto.response.OurHubRacePreviewResponse;
import com.example.backend.service.OurHubRacingImportService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/external-racing")
public class AdminExternalRacingController {

    private final OurHubRacingImportService ourHubRacingImportService;

    public AdminExternalRacingController(
            OurHubRacingImportService ourHubRacingImportService
    ) {
        this.ourHubRacingImportService = ourHubRacingImportService;
    }

    @GetMapping("/ourhub/course-info/{date}")
    public List<OurHubRacePreviewResponse> getOurHubCourseInfo(
            @PathVariable LocalDate date,
            Authentication authentication
    ) {
        return ourHubRacingImportService.getCourseInfoPreview(
                date,
                authentication.getName()
        );
    }
}
