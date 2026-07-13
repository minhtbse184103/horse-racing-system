package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class KycSubmissionRequestDTO {
    @Schema(example = "Nguyen Van A")
    @NotBlank(message = "Họ tên là bắt buộc.")
    @Size(max = 150, message = "Họ tên không được vượt quá 150 ký tự.")
    private String fullName;

    @Schema(example = "2000-01-01")
    @NotNull(message = "Ngày sinh là bắt buộc.")
    @Past(message = "Ngày sinh không hợp lệ.")
    private LocalDate dateOfBirth;

    @Schema(example = "MALE")
    @NotBlank(message = "Gender is required.")
    @Pattern(regexp = "(?i)MALE|FEMALE|OTHER", message = "Gender must be MALE, FEMALE or OTHER.")
    private String gender;

    @Schema(example = "Vietnamese")
    @NotBlank(message = "Nationality is required.")
    @Size(max = 255, message = "Nationality cannot exceed 255 characters.")
    private String nationality;

    @Schema(example = "Ho Chi Minh City")
    @NotBlank(message = "Address is required.")
    @Size(max = 500, message = "Address cannot exceed 500 characters.")
    private String address;

    @Schema(example = "001234567890")
    @NotBlank(message = "Số CCCD là bắt buộc.")
    @Pattern(regexp = "\\d{12}", message = "Số CCCD phải gồm đúng 12 chữ số.")
    private String identityNumber;

    @Schema(description = "Ảnh mặt trước CCCD, định dạng JPG hoặc PNG")
    @NotNull(message = "Ảnh mặt trước CCCD là bắt buộc.")
    private MultipartFile identityFrontFile;

    @Schema(description = "Ảnh mặt sau CCCD, định dạng JPG hoặc PNG")
    @NotNull(message = "Ảnh mặt sau CCCD là bắt buộc.")
    private MultipartFile identityBackFile;

    @Schema(description = "Ảnh selfie, định dạng JPG hoặc PNG")
    @NotNull(message = "Ảnh selfie là bắt buộc.")
    private MultipartFile selfieFile;
}
