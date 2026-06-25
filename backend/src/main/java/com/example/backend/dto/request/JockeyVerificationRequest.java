package com.example.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JockeyVerificationRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    @NotBlank(message = "Tên huấn luyện viên là bắt buộc")
    @Size(max = 255, message = "Tên huấn luyện viên không được vượt quá 255 ký tự")
    private String trainerName;

    @NotBlank(message = "Email huấn luyện viên là bắt buộc")
    @Email(message = "Email huấn luyện viên không đúng định dạng")
    private String trainerEmail;

    @Size(max = 500, message = "Địa chỉ học viện/chuồng ngựa không được vượt quá 500 ký tự")
    private String academyStableAddress;

    @NotBlank(message = "Cơ quan cấp phép là bắt buộc")
    @Size(max = 255, message = "Cơ quan cấp phép không được vượt quá 255 ký tự")
    private String issuingAuthority;

    private String verificationLink;

    @NotBlank(message = "Loại bằng là bắt buộc")
    private String licenceType;

    @NotNull(message = "Ngày hết hạn giấy phép là bắt buộc")
    @Future(message = "Ngày hết hạn phải ở tương lai")
    private LocalDate expiryDate;

    // Profile Info
    @NotNull(message = "Cân nặng là bắt buộc")
    @DecimalMin(value = "35.00", message = "Cân nặng tối thiểu 35kg")
    @DecimalMax(value = "90.00", message = "Cân nặng tối đa 90kg")
    private BigDecimal weight;

    @NotBlank(message = "Xếp hạng là bắt buộc")
    private String ranking;

    private String biography;

    private List<JockeyVerificationFileRequest> files;
}
