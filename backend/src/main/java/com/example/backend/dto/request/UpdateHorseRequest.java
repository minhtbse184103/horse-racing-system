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
public class UpdateHorseRequest {

    @NotBlank(message = "Tên ngựa là bắt buộc")
    @Size(min = 2, max = 100, message = "Tên ngựa phải có từ 2 đến 100 ký tự")
    @Pattern(regexp = "^[\\p{L}0-9][\\p{L}0-9 .'-]*$", message = "Tên ngựa chứa ký tự không hợp lệ")
    private String horseName;

    @NotBlank(message = "Giống ngựa là bắt buộc")
    @Size(min = 2, max = 100, message = "Tên giống ngựa phải có từ 2 đến 100 ký tự")
    @Pattern(regexp = "^[\\p{L}0-9][\\p{L}0-9 .'-]*$", message = "Tên giống ngựa chứa ký tự không hợp lệ")
    private String breed;

    @NotBlank(message = "Giới tính là bắt buộc")
    @Pattern(regexp = "(?i)MALE|FEMALE", message = "Giới tính phải là MALE hoặc FEMALE")
    private String gender;

    @NotBlank(message = "Màu lông là bắt buộc")
    @Size(min = 2, max = 50, message = "Màu lông phải có từ 2 đến 50 ký tự")
    @Pattern(regexp = "^[\\p{L}][\\p{L} .'-]*$", message = "Màu lông chứa ký tự không hợp lệ")
    private String color;

    @NotNull(message = "Ngày sinh là bắt buộc")
    @PastOrPresent(message = "Ngày sinh phải là hôm nay hoặc một ngày trong quá khứ")
    private LocalDate dayOfBirth;

    @NotNull(message = "Cân nặng là bắt buộc")
    @DecimalMin(value = "200.00", message = "Cân nặng của ngựa phải ít nhất là 200 kg")
    @DecimalMax(value = "1000.00", message = "Cân nặng của ngựa không được vượt quá 1000 kg")
    private BigDecimal weight;

    @NotNull(message = "Ngày hết hạn giấy chứng nhận sức khỏe là bắt buộc")
    @FutureOrPresent(message = "Ngày hết hạn giấy chứng nhận sức khỏe phải là hôm nay hoặc một ngày trong tương lai")
    private LocalDate healthCertExpiry;

    @NotBlank(message = "Đường dẫn hình ảnh là bắt buộc")
    @Pattern(regexp = "^https?://.+$", message = "Đường dẫn hình ảnh phải là URL HTTP hoặc HTTPS hợp lệ")
    private String imgUrl;
}
