package com.example.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.request.AdminCreateUserRequest;
import com.example.backend.dto.request.AdminUpdateUserRequest;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.service.AuthService;
import com.example.backend.service.UserService;

import jakarta.validation.Valid;
import java.util.List;
import lombok.AllArgsConstructor;
//admin
@RestController
@RequestMapping("/api/admin")
@AllArgsConstructor
public class AdminController {
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.ok(authService.createUserByAdmin(request));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers() {
        return ResponseEntity.ok(userService.getAllUser());
    }

    @GetMapping("/jockey-profiles/under-review")
    public ResponseEntity<List<JockeyProfileResponse>> getJockeyProfilesUnderReview() {
        return ResponseEntity.ok(userService.getJockeyProfilesUnderReview());
    }

    @GetMapping("/users/{userID}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Integer userID) {
        return ResponseEntity.ok(userService.getUserById(userID));
    }

    @PutMapping("/users/{userID}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Integer userID,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUserByAdmin(userID, request));
    }

    @DeleteMapping("/users/{userID}")
    public ResponseEntity<UserResponse> deleteUser(@PathVariable Integer userID) {
        return ResponseEntity.ok(userService.softDeleteUserByAdmin(userID));
    }
}
