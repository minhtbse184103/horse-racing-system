package com.example.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.UserResponse;
import com.example.backend.service.UserService;

import lombok.AllArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;

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

    @GetMapping("all")
    public ResponseEntity<List<UserResponse>> getUsers() {
        List<UserResponse> users = userService.getAllUser();
        return ResponseEntity.ok(users);
    }
}
