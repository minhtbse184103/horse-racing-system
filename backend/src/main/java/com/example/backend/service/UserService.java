package com.example.backend.service;

import java.util.List;
import java.util.Map;
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
    private static final String STATUS_UNDER_REVIEW = "UNDER_REVIEW";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String STATUS_READY = "READY";

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
        List<JockeyProfile> profiles = jockeyProfileRepository.findByStatusOrderByUpdatedAtDesc(STATUS_UNDER_REVIEW);
        Map<Integer, User> jockeysById = userRepository.findAllById(
                        profiles.stream()
                                .map(JockeyProfile::getJockeyId)
                                .toList())
                .stream()
                .filter(this::isJockey)
                .collect(Collectors.toMap(User::getUserID, user -> user));

        return profiles.stream()
                .map(profile -> mapJockeyProfileToResponse(jockeysById.get(profile.getJockeyId()), profile))
                .filter(profile -> profile != null)
                .toList();
    }

    @Transactional
    public JockeyProfileResponse approveJockeyProfile(Integer jockeyId) {
        User jockey = findUserById(jockeyId);
        if (!isJockey(jockey)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected user is not a jockey.");
        }

        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Jockey profile does not exist."));
        validateJockeyProfileUnderReview(jockey, profile);
        validateJockeyProfileReadyForApproval(profile);

        profile.setStatus(STATUS_READY);
        profile.setRejectionReason(null);
        jockey.setStatus(STATUS_ACTIVE);

        jockeyProfileRepository.save(profile);
        userRepository.save(jockey);
        return mapJockeyProfileToResponse(jockey, profile);
    }

    @Transactional
    public JockeyProfileResponse rejectJockeyProfile(Integer jockeyId, String feedback) {
        User jockey = findUserById(jockeyId);
        if (!isJockey(jockey)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected user is not a jockey.");
        }

        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Jockey profile does not exist."));
        validateJockeyProfileUnderReview(jockey, profile);
        if (!hasText(feedback)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rejection feedback is required.");
        }

        profile.setStatus(STATUS_REJECTED);
        profile.setRejectionReason(feedback.trim());
        jockey.setStatus(STATUS_ACTIVE);

        jockeyProfileRepository.save(profile);
        userRepository.save(jockey);
        return mapJockeyProfileToResponse(jockey, profile);
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
            userRepository.findByPhone(request.getPhone())
                    .filter(existingUser -> !existingUser.getUserID().equals(user.getUserID()))
                    .ifPresent(existingUser -> {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Phone already exists");
                    });
            user.setPhone(request.getPhone());
        }

        if (hasText(request.getRoleName())) {
            user.setRole(getRoleByName(request.getRoleName()));
        }

        if (hasText(request.getStatus())) {
            String status = request.getStatus().trim().toUpperCase();
            if (isJockeyReviewStatus(status)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Jockey review statuses must be changed through jockey profile review APIs.");
            }
            user.setStatus(status);
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
        return STATUS_UNDER_REVIEW.equals(status)
                || STATUS_REJECTED.equals(status);
    }

    private JockeyProfileResponse mapJockeyProfileToResponse(User jockey, JockeyProfile profile) {
        if (jockey == null || profile == null) {
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
                .rejectionReason(profile.getRejectionReason())
                .imgUrl(profile.getImgUrl())
                .build();
    }

    private void validateJockeyProfileUnderReview(User jockey, JockeyProfile profile) {
        if (!STATUS_ACTIVE.equals(jockey.getStatus())
                || !STATUS_UNDER_REVIEW.equals(profile.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only jockey profiles under review can be approved or rejected.");
        }
    }

    private void validateJockeyProfileReadyForApproval(JockeyProfile profile) {
        if (!hasText(profile.getLicenseNo())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Jockey license number is required before approval.");
        }
        if (profile.getWeight() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Jockey weight is required before approval.");
        }
        if (!hasText(profile.getRanking())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Jockey ranking is required before approval.");
        }
        if (!hasText(profile.getImgUrl())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Jockey proof image is required before approval.");
        }
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUserID(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getStatus(),
                user.getRole().getRoleName());
    }
}
