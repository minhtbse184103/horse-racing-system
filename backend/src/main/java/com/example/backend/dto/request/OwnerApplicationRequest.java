package com.example.backend.dto.request;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OwnerApplicationRequest {
    @NotBlank(message = "Stable Name is required")
    @Size(max = 255, message = "Stable Name cannot exceed 255 characters")
    private String stableName;

    @NotBlank(message = "Stable Address is required")
    @Size(max = 500, message = "Stable Address cannot exceed 500 characters")
    private String stableAddress;

    @NotNull(message = "Total Horses Owned is required")
    @Min(value = 1, message = "Total Horses Owned must be at least 1")
    private Integer totalHorsesOwned;

    @NotNull(message = "Stable Certificate file is required")
    private MultipartFile stableCertificateFile;

    @NotNull(message = "Horse Ownership Proof file is required")
    private MultipartFile horseOwnershipProofFile;
}
