package com.example.backend.service;

import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.JockeyVerification;
import com.example.backend.entity.OwnerApplication;
import com.example.backend.entity.OwnerProfile;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.JockeyVerificationFileRepository;
import com.example.backend.repository.JockeyVerificationRepository;
import com.example.backend.repository.OwnerApplicationRepository;
import com.example.backend.repository.OwnerProfileRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfessionalApprovalWalletProvisioningTest {

    @Mock private OwnerApplicationRepository ownerApplicationRepository;
    @Mock private OwnerProfileRepository ownerProfileRepository;
    @Mock private JockeyVerificationRepository jockeyVerificationRepository;
    @Mock private JockeyVerificationFileRepository jockeyVerificationFileRepository;
    @Mock private JockeyProfileRepository jockeyProfileRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private FileUploadService fileUploadService;
    @Mock private WalletProvisioningService walletProvisioningService;

    private User admin;

    @BeforeEach
    void setUp() {
        Role adminRole = role("ADMIN");
        admin = user(1, "admin@test.local", "ADMIN", adminRole);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin.getEmail(), null)
        );
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void approvingOwnerProvisionsWalletInApprovalFlow() {
        Role ownerRole = role("OWNER");
        User candidate = user(8, "owner@test.local", "OWNER", role("SPECTATOR"));
        OwnerApplication application = OwnerApplication.builder()
                .applicationId(4)
                .userId(candidate.getUserID())
                .status("PENDING")
                .build();
        when(ownerApplicationRepository.findById(application.getApplicationId()))
                .thenReturn(Optional.of(application));
        when(userRepository.findByIdForUpdate(candidate.getUserID())).thenReturn(Optional.of(candidate));
        when(userRepository.findById(candidate.getUserID())).thenReturn(Optional.of(candidate));
        when(roleRepository.findByRoleName("OWNER")).thenReturn(Optional.of(ownerRole));
        when(ownerProfileRepository.findById(candidate.getUserID())).thenReturn(Optional.empty());
        when(ownerProfileRepository.save(any(OwnerProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        new OwnerApplicationService(
                ownerApplicationRepository,
                ownerProfileRepository,
                userRepository,
                roleRepository,
                fileUploadService,
                walletProvisioningService
        ).approveApplication(application.getApplicationId(), null);

        assertEquals("OWNER", candidate.getRole().getRoleName());
        assertEquals("OWNER", candidate.getAccountType());
        verify(walletProvisioningService).provisionForApprovedProfessional(candidate);
    }

    @Test
    void approvingJockeyProvisionsWalletInApprovalFlow() {
        Role jockeyRole = role("JOCKEY");
        User candidate = user(9, "jockey@test.local", "JOCKEY", role("SPECTATOR"));
        JockeyVerification verification = JockeyVerification.builder()
                .verificationId(5)
                .jockeyId(candidate.getUserID())
                .verificationStatus("PENDING")
                .weight(new BigDecimal("52.00"))
                .build();
        when(jockeyVerificationRepository.findById(verification.getVerificationId()))
                .thenReturn(Optional.of(verification));
        when(jockeyVerificationRepository.save(verification)).thenReturn(verification);
        when(userRepository.findByIdForUpdate(candidate.getUserID())).thenReturn(Optional.of(candidate));
        when(userRepository.findById(admin.getUserID())).thenReturn(Optional.of(admin));
        when(roleRepository.findByRoleName("JOCKEY")).thenReturn(Optional.of(jockeyRole));
        when(jockeyProfileRepository.findById(candidate.getUserID())).thenReturn(Optional.empty());
        when(jockeyProfileRepository.save(any(JockeyProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(jockeyVerificationFileRepository.findByVerificationId(verification.getVerificationId()))
                .thenReturn(List.of());

        new JockeyVerificationServiceImpl(
                jockeyVerificationRepository,
                jockeyVerificationFileRepository,
                userRepository,
                roleRepository,
                jockeyProfileRepository,
                walletProvisioningService
        ).approveVerification(verification.getVerificationId(), null);

        assertEquals("JOCKEY", candidate.getRole().getRoleName());
        assertEquals("JOCKEY", candidate.getAccountType());
        verify(walletProvisioningService).provisionForApprovedProfessional(candidate);
    }

    private User user(Integer id, String email, String accountType, Role role) {
        User user = new User();
        user.setUserID(id);
        user.setEmail(email);
        user.setUsername(email.substring(0, email.indexOf('@')));
        user.setStatus("ACTIVE");
        user.setAccountType(accountType);
        user.setRole(role);
        return user;
    }

    private Role role(String name) {
        Role role = new Role();
        role.setRoleName(name);
        return role;
    }
}
