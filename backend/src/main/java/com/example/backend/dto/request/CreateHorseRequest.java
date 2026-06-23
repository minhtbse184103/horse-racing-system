package com.example.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class CreateHorseRequest {
    @NotBlank(message = "Horse Name is required")
    @Size(min = 2, max = 255, message = "Horse Name must be 2-255 characters")
    @Pattern(regexp = "^[\\p{L}0-9][\\p{L}0-9 .'-]*$", message = "Horse Name contains invalid characters")
    private String horseName;

    @NotNull(message = "Age is required")
    @Positive(message = "Age must be greater than 0")
    private Integer age;

    @NotNull(message = "Weight is required")
    @Positive(message = "Weight must be greater than 0")
    private BigDecimal weight;

    @NotBlank(message = "Colour is required")
    @Size(max = 255, message = "Colour cannot exceed 255 characters")
    private String colour;

    @NotBlank(message = "Sex is required")
    @Size(max = 50, message = "Sex cannot exceed 50 characters")
    private String sex;

    @NotBlank(message = "Breeding is required")
    @Size(max = 255, message = "Breeding cannot exceed 255 characters")
    private String breeding;

    @NotBlank(message = "Trainer is required")
    @Size(max = 255, message = "Trainer cannot exceed 255 characters")
    private String trainer;

    @JsonAlias("healthCertificateExpiryDate")
    @NotNull(message = "Health Certificate Expiry Date is required")
    @FutureOrPresent(message = "Health Certificate Expiry Date must be today or in the future")
    private LocalDate healthCertExpiry;

    @NotBlank(message = "Official Horse Profile URL is required")
    @Pattern(regexp = "https?://.+", message = "Official Horse Profile URL must be a valid URL")
    private String officialHorseProfileUrl;

    @NotNull(message = "Health Certificate file is required")
    private MultipartFile healthCertificateFile;
}
