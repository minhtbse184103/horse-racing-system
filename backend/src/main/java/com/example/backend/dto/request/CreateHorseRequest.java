package com.example.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonAlias;

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
    @NotBlank(message = "Passport Number is required")
    @Size(min = 3, max = 255, message = "Passport Number must be 3-255 characters")
    private String passportNumber;

    @NotBlank(message = "Horse Name is required")
    @Size(min = 2, max = 255, message = "Horse Name must be 2-255 characters")
    @Pattern(regexp = "^[\\p{L}0-9][\\p{L}0-9 .'-]*$", message = "Horse Name contains invalid characters")
    private String horseName;

    @NotBlank(message = "Breed is required")
    @Size(max = 255, message = "Breed cannot exceed 255 characters")
    private String breed;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "(?i)MALE|FEMALE", message = "Gender must be MALE or FEMALE")
    private String gender;

    @NotBlank(message = "Coat Color is required")
    @Size(max = 255, message = "Coat Color cannot exceed 255 characters")
    private String color;

    @NotNull(message = "Date of Birth is required")
    @PastOrPresent(message = "Date of Birth must be today or in the past")
    private LocalDate dayOfBirth;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "200.00", message = "Horse weight must be at least 200 kg")
    @DecimalMax(value = "1000.00", message = "Horse weight cannot exceed 1000 kg")
    private BigDecimal weight;

    @JsonAlias("healthCertificateExpiryDate")
    @NotNull(message = "Health Certificate Expiry Date is required")
    @FutureOrPresent(message = "Health Certificate Expiry Date must be today or in the future")
    private LocalDate healthCertExpiry;

    @NotBlank(message = "Horse Passport document URL is required")
    private String horsePassportUrl;

    @NotBlank(message = "Health Certificate URL is required")
    private String healthCertificateUrl;

    @NotBlank(message = "Horse Image URL is required")
    private String horseImageUrl;
}
