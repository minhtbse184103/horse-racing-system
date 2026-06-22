package com.example.backend.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class SignupRequest {
    @Schema(example = "spectator")
    @NotBlank(message = "Username khong duoc de trong")
    @Size(max = 255, message = "Username khong duoc vuot qua 255 ky tu")
    private String username;

    @Schema(example = "user@example.com")
    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong dung dinh dang")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", message = "Email khong dung dinh dang")
    private String email;

    @NotBlank(message = "So dien thoai khong duoc de trong")
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "So dien thoai phai gom 9-15 chu so va co the bat dau bang +")
    private String phone;

    @NotBlank(message = "Mat khau khong duoc de trong")
    @Size(min = 6, max = 72, message = "Mat khau phai co tu 6 den 72 ky tu")
    private String password;
}
