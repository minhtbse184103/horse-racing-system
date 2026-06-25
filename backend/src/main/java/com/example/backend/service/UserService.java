package com.example.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.request.AdminUpdateUserRequest;
import com.example.backend.dto.request.UpdateMyAccountRequest;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class UserService {
    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_UNDER_REVIEW = "UNDER_REVIEW";
    private static final String STATUS_REJECTED = "REJECTED";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JockeyProfileRepository jockeyProfileRepository;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateCurrentUserAccount(String email, UpdateMyAccountRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));

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

        return toResponse(userRepository.save(user));
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

        if (hasText(request.getRoleName())) {
            user.setRole(getRoleByName(request.getRoleName()));
        }

        if (hasText(request.getStatus())) {
            String status = request.getStatus().trim().toUpperCase();
            if (isJockeyReviewStatus(status) && !isJockey(user)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Các trạng thái PENDING, UNDER_REVIEW và REJECTED chỉ áp dụng cho người dùng nài ngựa.");
            }
            user.setStatus(status);
        }

        if (isJockeyReviewStatus(user.getStatus()) && !isJockey(user)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Các trạng thái PENDING, UNDER_REVIEW và REJECTED chỉ áp dụng cho người dùng nài ngựa.");
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse softDeleteUserByAdmin(Integer userID) {
        User user = findUserById(userID);
        user.setStatus("INACTIVE");
        return toResponse(userRepository.save(user));
    }

    private User findUserById(Integer userID) {
        return userRepository.findById(userID)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private Role getRoleByName(String roleName) {
        return roleRepository.findByRoleName(roleName.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Vai trò " + roleName + " chưa được khởi tạo trong hệ thống"));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean isJockey(User user) {
        return user.getRole() != null && ROLE_JOCKEY.equals(user.getRole().getRoleName());
    }

    private boolean isJockeyReviewStatus(String status) {
        return STATUS_PENDING.equals(status)
                || STATUS_UNDER_REVIEW.equals(status)
                || STATUS_REJECTED.equals(status);
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
                .ranking(profile.getRanking())
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
                user.getRole().getRoleName());
    }
}
