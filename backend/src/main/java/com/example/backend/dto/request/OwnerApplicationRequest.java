package com.example.backend.dto.request;

import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
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

    @NotBlank(message = "Stable Name is required")
    @Size(max = 255, message = "Stable Name cannot exceed 255 characters")
    private String stableName;

    @NotBlank(message = "Stable Address is required")
    @Size(max = 500, message = "Stable Address cannot exceed 500 characters")
    private String stableAddress;

    @NotNull(message = "Total Horses Owned is required")
    @Min(value = 1, message = "Total Horses Owned must be at least 1")
    private Integer totalHorsesOwned;

    @NotNull(message = "Identity Document file is required")
    private MultipartFile identityDocumentFile;

    @NotNull(message = "Stable Certificate file is required")
    private MultipartFile stableCertificateFile;

    @NotNull(message = "Horse Ownership Proof file is required")
    private MultipartFile horseOwnershipProofFile;
}
