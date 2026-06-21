package com.example.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.UserResponse;
import com.example.backend.service.UserService;

import lombok.AllArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.example.backend.dto.request.UpdateMyAccountRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/user/")
@AllArgsConstructor
public class UserController {
    UserService userService;

    @GetMapping("me")
    public UserResponse getMe(Authentication authentication) {
        String email = authentication.getName();
        return userService.getCurrentUser(email);
    }

    @PutMapping("me/account")
    public UserResponse updateMyAccount(
            Authentication authentication,
            @Valid @RequestBody UpdateMyAccountRequest request) {
        String email = authentication.getName();
        return userService.updateCurrentUserAccount(email, request);
    }

    @GetMapping("all")
    public ResponseEntity<List<UserResponse>> getUsers() {
        List<UserResponse> users = userService.getAllUser();
        return ResponseEntity.ok(users);
    }
}
