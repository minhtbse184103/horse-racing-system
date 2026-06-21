package com.example.backend.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    public JockeyProfileResponse approveJockeyProfile(Integer jockeyId) {
        User jockey = findUserById(jockeyId);
        if (!isJockey(jockey)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Người dùng được chọn không phải là nài ngựa.");
        }

        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Hồ sơ nài ngựa không tồn tại."));
        validateJockeyProfileUnderReview(jockey, profile);
        validateJockeyProfileReadyForApproval(profile);

        profile.setStatus(STATUS_ACTIVE);
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
            throw new ApiException(HttpStatus.BAD_REQUEST, "Người dùng được chọn không phải là nài ngựa.");
        }

        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Hồ sơ nài ngựa không tồn tại."));
        validateJockeyProfileUnderReview(jockey, profile);
        if (!hasText(feedback)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phản hồi từ chối là bắt buộc.");
        }

        profile.setStatus(STATUS_REJECTED);
        profile.setRejectionReason(feedback.trim());
        jockey.setStatus(STATUS_REJECTED);

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
            if (STATUS_REJECTED.equals(status) && !hasText(request.getRejectionReason())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Lý do từ chối là bắt buộc khi từ chối nài ngựa.");
            }
            syncJockeyProfileStatus(user, status);
            if (STATUS_REJECTED.equals(status)) {
                updateJockeyProfileRejectionReason(user, request.getRejectionReason());
            }
            user.setStatus(status);
        } else if (hasText(request.getRejectionReason()) && STATUS_REJECTED.equals(user.getStatus()) && isJockey(user)) {
            updateJockeyProfileRejectionReason(user, request.getRejectionReason());
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

    private void syncJockeyProfileStatus(User user, String status) {
        if (!isJockey(user)) {
            return;
        }

        if (STATUS_ACTIVE.equals(status)) {
            JockeyProfile profile = jockeyProfileRepository.findById(user.getUserID())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                            "Hồ sơ nài ngựa không tồn tại."));
            profile.setStatus(STATUS_ACTIVE);
            profile.setRejectionReason(null);
            jockeyProfileRepository.save(profile);
            return;
        }

        if (STATUS_UNDER_REVIEW.equals(status)) {
            jockeyProfileRepository.findById(user.getUserID())
                    .ifPresent(profile -> {
                        profile.setStatus(status);
                        profile.setRejectionReason(null);
                        jockeyProfileRepository.save(profile);
                    });
            return;
        }

        if (STATUS_REJECTED.equals(status)) {
            JockeyProfile profile = jockeyProfileRepository.findById(user.getUserID())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                            "Hồ sơ nài ngựa không tồn tại."));
            profile.setStatus(status);
            profile.setRejectionReason(null);
            jockeyProfileRepository.save(profile);
        }
    }

    private void updateJockeyProfileRejectionReason(User user, String rejectionReason) {
        JockeyProfile profile = jockeyProfileRepository.findById(user.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Hồ sơ nài ngựa không tồn tại."));
        profile.setRejectionReason(rejectionReason.trim());
        jockeyProfileRepository.save(profile);
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
                .rejectionReason(profile.getRejectionReason())
                .imgUrl(profile.getImgUrl())
                .build();
    }

    private void validateJockeyProfileUnderReview(User jockey, JockeyProfile profile) {
        if (!STATUS_UNDER_REVIEW.equals(jockey.getStatus())
                || !STATUS_UNDER_REVIEW.equals(profile.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Chỉ có thể phê duyệt hoặc từ chối hồ sơ nài ngựa đang được xét duyệt.");
        }
    }

    private void validateJockeyProfileReadyForApproval(JockeyProfile profile) {
        if (!hasText(profile.getLicenseNo())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Số giấy phép của nài ngựa là bắt buộc trước khi phê duyệt.");
        }
        if (profile.getWeight() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Cân nặng của nài ngựa là bắt buộc trước khi phê duyệt.");
        }
        if (!hasText(profile.getRanking())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Xếp hạng của nài ngựa là bắt buộc trước khi phê duyệt.");
        }
        if (!hasText(profile.getImgUrl())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Ảnh minh chứng của nài ngựa là bắt buộc trước khi phê duyệt.");
        }
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
