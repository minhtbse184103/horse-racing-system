package com.example.backend.constant;

import java.util.List;

public final class RaceResultSubmissionStatus {

    public static final String SUBMITTED = "SUBMITTED";
    public static final String REFEREE_CONFIRMED = "REFEREE_CONFIRMED";
    public static final String REFEREE_FLAGGED = "REFEREE_FLAGGED";
    public static final String ADMIN_APPROVED = "ADMIN_APPROVED";
    public static final String ADMIN_REJECTED = "ADMIN_REJECTED";

    public static final List<String> ACTIVE_SUBMISSION_STATUSES = List.of(
            SUBMITTED,
            REFEREE_CONFIRMED,
            REFEREE_FLAGGED
    );

    private RaceResultSubmissionStatus() {
    }
}
