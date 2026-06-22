package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JockeyVerificationFileRequest {

    @NotBlank(message = "Đường dẫn file là bắt buộc")
    @Pattern(regexp = "^https?://.+$", message = "Đường dẫn file phải là URL HTTP hoặc HTTPS hợp lệ")
    private String fileUrl;

    @NotBlank(message = "Loại file là bắt buộc")
    @Pattern(regexp = "(?i)PDF|IMAGE|DOCUMENT", message = "Loại file phải là PDF, IMAGE hoặc DOCUMENT")
    private String fileType;
}
