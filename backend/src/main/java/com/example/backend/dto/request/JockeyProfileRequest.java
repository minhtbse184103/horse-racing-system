package com.example.backend.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JockeyProfileRequest {

    @NotBlank(message = "Số giấy phép là bắt buộc")
    @Size(min = 5, max = 50, message = "Số giấy phép phải có từ 5 đến 50 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Số giấy phép chỉ được chứa chữ cái, chữ số và dấu gạch nối")
    private String licenseNo;

    @NotNull(message = "Cân nặng là bắt buộc")
    @DecimalMin(value = "35.00", message = "Cân nặng của nài ngựa phải ít nhất là 35 kg")
    @DecimalMax(value = "90.00", message = "Cân nặng của nài ngựa không được vượt quá 90 kg")
    private BigDecimal weight;

    @NotBlank(message = "Xếp hạng là bắt buộc")
    @Pattern(regexp = "(?i)BEGINNER|INTERMEDIATE|PROFESSIONAL|ELITE", message = "Xếp hạng phải là BEGINNER, INTERMEDIATE, PROFESSIONAL hoặc ELITE")
    private String ranking;

    @NotBlank(message = "Đường dẫn hình ảnh là bắt buộc")
    @Pattern(regexp = "^https?://.+$", message = "Đường dẫn hình ảnh phải là URL HTTP hoặc HTTPS hợp lệ")
    private String imgUrl;
}
