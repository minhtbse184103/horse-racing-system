package com.example.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateHorseRequest {

    @NotBlank(message = "Horse name is required")
    @Size(min = 2, max = 100, message = "Horse name must be between 2 and 100 characters")
    @Pattern(regexp = "^[\\p{L}0-9][\\p{L}0-9 .'-]*$", message = "Horse name contains invalid characters")
    private String horseName;

    @NotBlank(message = "Breed is required")
    @Size(min = 2, max = 100, message = "Breed must be between 2 and 100 characters")
    @Pattern(regexp = "^[\\p{L}0-9][\\p{L}0-9 .'-]*$", message = "Breed contains invalid characters")
    private String breed;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "(?i)MALE|FEMALE", message = "Gender must be MALE or FEMALE")
    private String gender;

    @NotBlank(message = "Color is required")
    @Size(min = 2, max = 50, message = "Color must be between 2 and 50 characters")
    @Pattern(regexp = "^[\\p{L}][\\p{L} .'-]*$", message = "Color contains invalid characters")
    private String color;

    @NotNull(message = "Date of birth is required")
    @PastOrPresent(message = "Date of birth must be today or in the past")
    private LocalDate dayOfBirth;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "200.00", message = "Horse weight must be at least 200 kg")
    @DecimalMax(value = "1000.00", message = "Horse weight must not exceed 1000 kg")
    private BigDecimal weight;

    @NotNull(message = "Health certificate expiry is required")
    @FutureOrPresent(message = "Health certificate expiry must be today or in the future")
    private LocalDate healthCertExpiry;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "(?i)ACTIVE|INACTIVE", message = "Status must be ACTIVE or INACTIVE")
    private String status;

    @NotBlank(message = "Image URL is required")
    @Pattern(regexp = "^https?://.+$", message = "Image URL must be a valid HTTP or HTTPS URL")
    private String imgUrl;
}
