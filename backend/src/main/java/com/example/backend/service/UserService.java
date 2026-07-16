package com.example.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.request.AdminUpdateUserRequest;
import com.example.backend.dto.request.UpdateMyAccountRequest;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserService {
    private static final String ROLE_ADMIN = "ADMIN";

    private final UserRepository userRepository;
    private final JockeyProfileRepository jockeyProfileRepository;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        return toResponse(user);
    }

    @Transactional
    public LoginResponse updateCurrentUserAccount(String email, UpdateMyAccountRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

        if (hasText(request.getFullName())) {
            String nextUsername = request.getFullName().trim();
            userRepository.findByUsername(nextUsername)
                    .filter(existingUser -> !existingUser.getUserID().equals(user.getUserID()))
                    .ifPresent(existingUser -> {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Username da ton tai");
                    });
            user.setUsername(nextUsername);
        }

        if (hasText(request.getEmail()) && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(request.getEmail())
                    .ifPresent(existingUser -> {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Email đã tồn tại");
                    });
            user.setEmail(request.getEmail());
        }

        if (hasText(request.getPhone()) && !request.getPhone().equals(user.getPhone())) {
            userRepository.findByPhone(request.getPhone())
                    .filter(existingUser -> !existingUser.getUserID().equals(user.getUserID()))
                    .ifPresent(existingUser -> {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại");
                    });
            user.setPhone(request.getPhone());
        }

        User savedUser = userRepository.save(user);
        String roleName = savedUser.getRole().getRoleName();
        String token = jwtUtil.generateToken(savedUser.getEmail(), roleName);
        return new LoginResponse(token, toResponse(savedUser));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUser() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Integer userID) {
        return toResponse(findUserById(userID));
    }

    @Transactional
    public UserResponse updateUserByAdmin(Integer userID, AdminUpdateUserRequest request) {
        User user = findUserById(userID);
        rejectAdminAccountManagement(user);

        if (hasText(request.getEmail()) && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(request.getEmail())
                    .ifPresent(existingUser -> {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Email đã tồn tại");
                    });
            user.setEmail(request.getEmail());
        }

        if (hasText(request.getFullName())) {
            user.setUsername(request.getFullName().trim());
        }

        if (hasText(request.getPhone())) {
            userRepository.findByPhone(request.getPhone())
                    .filter(existingUser -> !existingUser.getUserID().equals(user.getUserID()))
                    .ifPresent(existingUser -> {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại");
                    });
            user.setPhone(request.getPhone());
        }

        if (hasText(request.getStatus())) {
            String status = request.getStatus().trim().toUpperCase();
            user.setStatus(status);
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse softDeleteUserByAdmin(Integer userID) {
        User user = findUserById(userID);
        rejectAdminAccountManagement(user);
        user.setStatus("INACTIVE");
        return toResponse(userRepository.save(user));
    }

    private User findUserById(Integer userID) {
        return userRepository.findById(userID)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && ROLE_ADMIN.equals(user.getRole().getRoleName());
    }

    private void rejectAdminAccountManagement(User user) {
        if (isAdmin(user)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Tai khoan admin chi duoc cap nhat o trang Tai khoan admin.");
        }
    }

    public JockeyProfileResponse mapJockeyProfileToResponse(User jockey, JockeyProfile profile) {
        if (profile == null) {
            return null;
        }

        return JockeyProfileResponse.builder()
                .jockeyId(jockey.getUserID())
                .fullName(profile.getFullName() != null ? profile.getFullName() : jockey.getUsername())
                .email(jockey.getEmail())
                .weight(profile.getWeight())
                .biography(profile.getBiography())
                .totalRaces(profile.getTotalRaces())
                .totalWins(profile.getTotalWins())
                .build();
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserID(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus(),
                user.getRole().getRoleName(),
                user.getAccountType());
    }
}
