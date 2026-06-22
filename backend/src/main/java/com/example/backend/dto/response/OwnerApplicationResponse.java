package com.example.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OwnerApplicationResponse {
    private Integer applicationId;
    private Integer userId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String nationality;
    private String address;
    private String identityDocumentImage;
    private String identityDocumentFileName;
    private String status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;
}
