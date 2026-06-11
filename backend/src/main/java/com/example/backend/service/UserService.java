package com.example.backend.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.request.AdminUpdateUserRequest;
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
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_UNDER_REVIEW = "UNDER_REVIEW";
    private static final String STATUS_REJECTED = "REJECTED";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JockeyProfileRepository jockeyProfileRepository;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không thấy user"));
        return toResponse(user);
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

    @Transactional(readOnly = true)
    public List<JockeyProfileResponse> getJockeyProfilesUnderReview() {
        List<User> jockeys = userRepository.findByStatusAndRoleRoleNameOrderByUpdatedAtDesc(
                STATUS_UNDER_REVIEW,
                ROLE_JOCKEY);
        List<Integer> jockeyIds = jockeys.stream()
                .map(User::getUserID)
                .toList();
        Map<Integer, JockeyProfile> profilesByJockeyId = jockeyProfileRepository.findByJockeyIdIn(jockeyIds)
                .stream()
                .collect(Collectors.toMap(JockeyProfile::getJockeyId, Function.identity()));

        return jockeys.stream()
                .map(jockey -> mapJockeyProfileToResponse(jockey, profilesByJockeyId.get(jockey.getUserID())))
                .filter(profile -> profile != null)
                .toList();
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
            user.setFullName(request.getFullName());
        }

        if (hasText(request.getPhone())) {
            user.setPhone(request.getPhone());
        }

        if (hasText(request.getRoleName())) {
            user.setRole(getRoleByName(request.getRoleName()));
        }

        if (hasText(request.getStatus())) {
            String status = request.getStatus().trim().toUpperCase();
            if (isJockeyReviewStatus(status) && !isJockey(user)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "PENDING, UNDER_REVIEW and REJECTED statuses are only allowed for jockey users.");
            }
            if (STATUS_REJECTED.equals(status) && !hasText(request.getRejectionReason())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Rejection reason is required when rejecting a jockey.");
            }
            user.setStatus(status);
            user.setRejectionReason(STATUS_REJECTED.equals(status)
                    ? request.getRejectionReason().trim()
                    : null);
            syncJockeyProfileStatus(user, status);
        } else if (hasText(request.getRejectionReason()) && STATUS_REJECTED.equals(user.getStatus())) {
            user.setRejectionReason(request.getRejectionReason().trim());
        }

        if (isJockeyReviewStatus(user.getStatus()) && !isJockey(user)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "PENDING, UNDER_REVIEW and REJECTED statuses are only allowed for jockey users.");
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
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không thấy user"));
    }

    private Role getRoleByName(String roleName) {
        return roleRepository.findByRoleName(roleName.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Role " + roleName + " chưa được seed"));
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

    private void syncJockeyProfileStatus(User user, String status) {
        if (!isJockey(user)) {
            return;
        }

        if (STATUS_ACTIVE.equals(status)) {
            JockeyProfile profile = jockeyProfileRepository.findById(user.getUserID())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                            "Jockey profile does not exist."));
            profile.setStatus(STATUS_ACTIVE);
            jockeyProfileRepository.save(profile);
            return;
        }

        if (STATUS_UNDER_REVIEW.equals(status) || STATUS_REJECTED.equals(status)) {
            jockeyProfileRepository.findById(user.getUserID())
                    .ifPresent(profile -> {
                        profile.setStatus(status);
                        jockeyProfileRepository.save(profile);
                    });
        }
    }

    private JockeyProfileResponse mapJockeyProfileToResponse(User jockey, JockeyProfile profile) {
        if (profile == null) {
            return null;
        }

        return JockeyProfileResponse.builder()
                .jockeyId(jockey.getUserID())
                .fullName(jockey.getFullName())
                .email(jockey.getEmail())
                .licenseNo(profile.getLicenseNo())
                .weight(profile.getWeight())
                .ranking(profile.getRanking())
                .status(profile.getStatus())
                .imgUrl(profile.getImgUrl())
                .build();
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserID(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getStatus(),
                user.getRejectionReason(),
                user.getRole().getRoleName());
    }
}
