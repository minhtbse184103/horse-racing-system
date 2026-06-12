package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class AdminUpdateUserRequest {
    @Schema(example = "user@example.com")
    @Email(message = "Email không đúng định dạng")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email không đúng định dạng")
    private String email;

    @Size(max = 255, message = "Họ và tên không được vượt quá 255 ký tự")
    private String fullName;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Số điện thoại phải gồm 9-15 chữ số và có thể bắt đầu bằng +")
    private String phone;

    @Pattern(regexp = "(?i)ADMIN|OWNER|JOCKEY|REFEREE|SPECTATOR", message = "Vai trò phải là ADMIN, OWNER, JOCKEY, REFEREE hoặc SPECTATOR")
    private String roleName;

    @Pattern(regexp = "(?i)PENDING|UNDER_REVIEW|ACTIVE|REJECTED|INACTIVE|BLOCKED", message = "Trạng thái phải là PENDING, UNDER_REVIEW, ACTIVE, REJECTED, INACTIVE hoặc BLOCKED")
    private String status;

    @Size(max = 500, message = "Lý do từ chối không được vượt quá 500 ký tự")
    private String rejectionReason;
}
