package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponse {
    private Integer Id;
    private String username;
    private String email;
    private String phone;
    private String status;
    private String role;
}
