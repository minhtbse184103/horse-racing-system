package com.example.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class AdminUpdateUserRequest {
    @Email(message = "Email không đúng định dạng")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email không đúng định dạng")
    private String email;

    @Size(max = 255, message = "Full name không được vượt quá 255 ký tự")
    private String fullName;

    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Phone phải gồm 9-15 chữ số và có thể bắt đầu bằng +")
    private String phone;

    @Pattern(regexp = "(?i)ADMIN|OWNER|JOCKEY|REFEREE|SPECTATOR", message = "Role phải là ADMIN, OWNER, JOCKEY, REFEREE hoặc SPECTATOR")
    private String roleName;

    @Pattern(regexp = "(?i)ACTIVE|INACTIVE|BLOCKED", message = "Status phải là ACTIVE, INACTIVE hoặc BLOCKED")
    private String status;
}
