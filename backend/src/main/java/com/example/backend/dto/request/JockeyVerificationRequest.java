package com.example.backend.dto.request;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JockeyVerificationRequest {

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

    @Pattern(regexp = "^(https?://.+)?$", message = "Đường dẫn xác minh phải là URL HTTP hoặc HTTPS hợp lệ")
    private String verificationLink;

    @NotBlank(message = "Loại giấy phép là bắt buộc")
    @Pattern(regexp = "(?i)PRO|AMATEUR|APPRENTICE", message = "Loại giấy phép phải là PRO, AMATEUR hoặc APPRENTICE")
    private String licenceType;

    @NotNull(message = "Ngày hết hạn giấy phép là bắt buộc")
    @Future(message = "Ngày hết hạn phải ở tương lai")
    private LocalDate expiryDate;

    private List<JockeyVerificationFileRequest> files;
}
