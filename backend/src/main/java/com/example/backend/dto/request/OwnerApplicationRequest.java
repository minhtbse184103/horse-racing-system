package com.example.backend.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class OwnerApplicationRequest {
    @NotBlank(message = "Full Name is required")
    @Size(max = 255, message = "Full Name cannot exceed 255 characters")
    private String fullName;

    @NotNull(message = "Date of Birth is required")
    @Past(message = "Date of Birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "(?i)MALE|FEMALE|OTHER", message = "Gender must be MALE, FEMALE or OTHER")
    private String gender;

    @NotBlank(message = "Nationality is required")
    @Size(max = 255, message = "Nationality cannot exceed 255 characters")
    private String nationality;

    @NotBlank(message = "Address is required")
    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String address;

    @NotBlank(message = "Identity document image is required")
    private String identityDocumentImage;

    @Size(max = 255, message = "Identity document file name cannot exceed 255 characters")
    private String identityDocumentFileName;
}
