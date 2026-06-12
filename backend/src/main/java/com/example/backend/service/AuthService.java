package com.example.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.backend.dto.request.AdminCreateUserRequest;
import com.example.backend.dto.request.SignupRequest;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AuthService {
    private static final String EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
    private static final String PHONE_REGEX = "^\\+?[0-9]{9,15}$";
    private static final String DEFAULT_PUBLIC_ROLE = "SPECTATOR";
    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_UNDER_REVIEW = "UNDER_REVIEW";
    private static final String STATUS_REJECTED = "REJECTED";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(String email, String password) {
        validateLoginRequest(email, password);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email không tồn tại"));

        if (!canLogin(user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn hoạt động");
        }

        if (!isPasswordValid(password, user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Mật khẩu không chính xác");
        }

        String roleName = user.getRole().getRoleName();
        String token = jwtUtil.generateToken(user.getEmail(), roleName);
        UserResponse userInfo = new UserResponse(
                user.getUserID(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getStatus(),
                roleName);

        return new LoginResponse(token, userInfo);
    }

    public UserResponse signup(SignupRequest request) {
        validateSignupRequest(request);

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email đã tồn tại");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại");
        }

        String roleName = normalizePublicRole(request.getRoleName());
        Role role = getRoleByName(roleName);

        User user = createUser(
                request.getEmail(),
                request.getFullName(),
                request.getPhone(),
                request.getPassword(),
                role,
                roleName.equals(ROLE_JOCKEY) ? STATUS_PENDING : null);
        return toResponse(user);
    }

    public UserResponse createUserByAdmin(AdminCreateUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email đã tồn tại");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại");
        }

        Role role = getRoleByName(normalizeAdminRole(request.getRoleName()));
        User user = createUser(
                request.getEmail(),
                request.getFullName(),
                request.getPhone(),
                request.getPassword(),
                role,
                null);
        return toResponse(user);
    }

    private void validateLoginRequest(String email, String password) {
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        if (!email.matches(EMAIL_REGEX)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email không đúng định dạng");
        }
        if (password == null || password.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu không được để trống");
        }
        if (password.length() < 6 || password.length() > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có từ 6 đến 72 ký tự");
        }
    }

    private void validateSignupRequest(SignupRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        if (!request.getEmail().matches(EMAIL_REGEX)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email không đúng định dạng");
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Họ và tên không được để trống");
        }
        if (request.getFullName().length() > 255) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Họ và tên không được vượt quá 255 ký tự");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu không được để trống");
        }
        if (request.getPassword().length() < 6 || request.getPassword().length() > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có từ 6 đến 72 ký tự");
        }
        if (request.getPhone() == null || request.getPhone().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số điện thoại không được để trống");
        }
        if (!request.getPhone().matches(PHONE_REGEX)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Số điện thoại phải gồm 9-15 chữ số và có thể bắt đầu bằng +");
        }
        normalizePublicRole(request.getRoleName());
    }

    private String normalizePublicRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return DEFAULT_PUBLIC_ROLE;
        }

        String normalizedRole = roleName.trim().toUpperCase();
        if (!normalizedRole.equals("OWNER")
                && !normalizedRole.equals("JOCKEY")
                && !normalizedRole.equals("SPECTATOR")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Vai trò đăng ký công khai chỉ được là OWNER, JOCKEY hoặc SPECTATOR");
        }
        return normalizedRole;
    }

    private String normalizeAdminRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vai trò không được để trống");
        }

        String normalizedRole = roleName.trim().toUpperCase();
        if (!normalizedRole.equals("ADMIN")
                && !normalizedRole.equals("OWNER")
                && !normalizedRole.equals("JOCKEY")
                && !normalizedRole.equals("REFEREE")
                && !normalizedRole.equals("SPECTATOR")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Vai trò phải là ADMIN, OWNER, JOCKEY, REFEREE hoặc SPECTATOR");
        }
        return normalizedRole;
    }

    private Role getRoleByName(String roleName) {
        return roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Vai trò " + roleName + " chưa được khởi tạo trong hệ thống"));
    }

    private User createUser(String email, String fullName, String phone, String password, Role role, String status) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setStatus(status);
        return userRepository.save(user);
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

    private boolean canLogin(User user) {
        String status = user.getStatus();
        if (status == null || status.equalsIgnoreCase(STATUS_ACTIVE)) {
            return true;
        }

        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        return ROLE_JOCKEY.equals(roleName)
                && (status.equalsIgnoreCase(STATUS_PENDING)
                || status.equalsIgnoreCase(STATUS_UNDER_REVIEW)
                || status.equalsIgnoreCase(STATUS_REJECTED));
    }

    private boolean isPasswordValid(String rawPassword, User user) {
        String storedPassword = user.getPassword();
        if (storedPassword != null && storedPassword.startsWith("$2")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        if (rawPassword.equals(storedPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }
}
