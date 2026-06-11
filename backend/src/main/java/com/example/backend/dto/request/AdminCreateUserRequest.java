package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class AdminCreateUserRequest {
    @Schema(example = "user@example.com")
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Full name không được để trống")
    @Size(max = 255, message = "Full name không được vượt quá 255 ký tự")
    private String fullName;

    @NotBlank(message = "Phone không được để trống")
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Phone phải gồm 9-15 chữ số và có thể bắt đầu bằng +")
    private String phone;

    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, max = 72, message = "Password phải từ 6 đến 72 ký tự")
    private String password;

    @NotBlank(message = "Role không được để trống")
    @Pattern(regexp = "(?i)ADMIN|OWNER|JOCKEY|REFEREE|SPECTATOR", message = "Role phải là ADMIN, OWNER, JOCKEY, REFEREE hoặc SPECTATOR")
    private String roleName;
}
