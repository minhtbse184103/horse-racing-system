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
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email khong ton tai"));

        if (!canLogin(user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Tai khoan khong con hoat dong");
        }

        if (!isPasswordValid(password, user)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Mat khau khong chinh xac");
        }

        String roleName = user.getRole().getRoleName();
        String token = jwtUtil.generateToken(user.getEmail(), roleName);
        return new LoginResponse(token, toResponse(user));
    }

    public UserResponse signup(SignupRequest request) {
        validateSignupRequest(request);

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Username da ton tai");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email da ton tai");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "So dien thoai da ton tai");
        }

        Role role = getRoleByName(DEFAULT_PUBLIC_ROLE);
        User user = createUser(
                request.getUsername(),
                request.getEmail(),
                request.getPhone(),
                request.getPassword(),
                role,
                STATUS_ACTIVE);
        return toResponse(user);
    }

    public UserResponse createUserByAdmin(AdminCreateUserRequest request) {
        String username = request.getFullName();

        if (userRepository.existsByUsername(username)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Username da ton tai");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email da ton tai");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "So dien thoai da ton tai");
        }

        Role role = getRoleByName(normalizeAdminRole(request.getRoleName()));
        User user = createUser(
                username,
                request.getEmail(),
                request.getPhone(),
                request.getPassword(),
                role,
                null);
        return toResponse(user);
    }

    private void validateLoginRequest(String email, String password) {
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email khong duoc de trong");
        }
        if (!email.matches(EMAIL_REGEX)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email khong dung dinh dang");
        }
        if (password == null || password.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mat khau khong duoc de trong");
        }
        if (password.length() < 6 || password.length() > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mat khau phai co tu 6 den 72 ky tu");
        }
    }

    private void validateSignupRequest(SignupRequest request) {
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Username khong duoc de trong");
        }
        if (request.getUsername().length() > 255) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Username khong duoc vuot qua 255 ky tu");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email khong duoc de trong");
        }
        if (!request.getEmail().matches(EMAIL_REGEX)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email khong dung dinh dang");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mat khau khong duoc de trong");
        }
        if (request.getPassword().length() < 6 || request.getPassword().length() > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mat khau phai co tu 6 den 72 ky tu");
        }
        if (request.getPhone() == null || request.getPhone().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "So dien thoai khong duoc de trong");
        }
        if (!request.getPhone().matches(PHONE_REGEX)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "So dien thoai phai gom 9-15 chu so va co the bat dau bang +");
        }
    }

    private String normalizeAdminRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vai tro khong duoc de trong");
        }

        String normalizedRole = roleName.trim().toUpperCase();
        if (!normalizedRole.equals("ADMIN")
                && !normalizedRole.equals("OWNER")
                && !normalizedRole.equals("JOCKEY")
                && !normalizedRole.equals("REFEREE")
                && !normalizedRole.equals("SPECTATOR")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Vai tro phai la ADMIN, OWNER, JOCKEY, REFEREE hoac SPECTATOR");
        }
        return normalizedRole;
    }

    private Role getRoleByName(String roleName) {
        return roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Vai tro " + roleName + " chua duoc khoi tao trong he thong"));
    }

    private User createUser(String username, String email, String phone, String password, Role role, String status) {
        User user = new User();
        user.setUsername(username.trim());
        user.setEmail(email.trim());
        user.setPhone(phone.trim());
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setStatus(status);
        return userRepository.save(user);
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
