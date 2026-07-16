package com.example.backend.service;

import com.example.backend.dto.request.SignupRequest;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Test
    void ownerSignupKeepsSpectatorPermissionUntilApplicationApproval() throws Exception {
        UserRepository users = mock(UserRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        JwtUtil jwtUtil = mock(JwtUtil.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        AuthService service = new AuthService(users, roles, jwtUtil, passwordEncoder);

        Role spectatorRole = new Role();
        spectatorRole.setRoleName("SPECTATOR");
        when(roles.findByRoleName("SPECTATOR")).thenReturn(Optional.of(spectatorRole));
        when(passwordEncoder.encode("secret123")).thenReturn("encoded");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setUserID(42);
            return saved;
        });

        SignupRequest request = new ObjectMapper().readValue("""
                {
                  "username":"new.owner",
                  "email":"owner@example.com",
                  "phone":"0901234567",
                  "password":"secret123",
                  "accountType":"owner"
                }
                """, SignupRequest.class);

        var response = service.signup(request);

        assertEquals("OWNER", response.getAccountType());
        assertEquals("SPECTATOR", response.getRole());
        verify(users).save(argThat(user -> "OWNER".equals(user.getAccountType())
                && "SPECTATOR".equals(user.getRole().getRoleName())
                && "ACTIVE".equals(user.getStatus())));
    }
}
