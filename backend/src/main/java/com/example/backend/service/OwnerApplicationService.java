package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.request.OwnerApplicationRequest;
import com.example.backend.dto.request.AdminRoleApprovalRequest;
import com.example.backend.dto.response.OwnerApplicationResponse;
import com.example.backend.dto.response.FileUploadResponse;
import com.example.backend.dto.response.OwnerProfileResponse;
import com.example.backend.entity.OwnerApplication;
import com.example.backend.entity.OwnerProfile;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.OwnerApplicationRepository;
import com.example.backend.repository.OwnerProfileRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;

@Service
public class OwnerApplicationService {
    private static final String ROLE_OWNER = "OWNER";
    private static final String ROLE_SPECTATOR = "SPECTATOR";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String OWNER_DOCUMENT_FOLDER = "owner-applications";

    private final OwnerApplicationRepository ownerApplicationRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final FileUploadService fileUploadService;

    public OwnerApplicationService(
            OwnerApplicationRepository ownerApplicationRepository,
            OwnerProfileRepository ownerProfileRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            FileUploadService fileUploadService) {
        this.ownerApplicationRepository = ownerApplicationRepository;
        this.ownerProfileRepository = ownerProfileRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.fileUploadService = fileUploadService;
    }

    @Transactional
    public OwnerApplicationResponse submitMyApplication(OwnerApplicationRequest request) {
        User user = getCurrentUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : null;
        if (ROLE_OWNER.equals(roleName)) {
            throw new ApiException(HttpStatus.CONFLICT, "User is already an owner.");
        }
        if (!ROLE_OWNER.equals(effectiveAccountType(user))) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Only accounts registered as OWNER can submit an owner application.");
        }
        if (!ROLE_SPECTATOR.equals(roleName)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account cannot submit an owner application.");
        }

        if (ownerApplicationRepository.existsByUserIdAndStatus(user.getUserID(), STATUS_PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT, "An owner application is already pending.");
        }

        validateFile(request.getStableCertificateFile(), "Stable Certificate file is required.");
        validateFile(request.getHorseOwnershipProofFile(), "Horse Ownership Proof file is required.");

        FileUploadResponse stableCertificate = fileUploadService.upload(request.getStableCertificateFile(), OWNER_DOCUMENT_FOLDER);
        FileUploadResponse horseOwnershipProof = fileUploadService.upload(request.getHorseOwnershipProofFile(), OWNER_DOCUMENT_FOLDER);

        OwnerApplication application = OwnerApplication.builder()
                .userId(user.getUserID())
                .stableName(normalizeText(request.getStableName()))
                .stableAddress(normalizeText(request.getStableAddress()))
                .stableCertificateUrl(stableCertificate.getUrl())
                .totalHorsesOwned(request.getTotalHorsesOwned())
                .horseOwnershipProofUrl(horseOwnershipProof.getUrl())
                .status(STATUS_PENDING)
                .submittedAt(LocalDateTime.now())
                .build();

        return mapApplication(ownerApplicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public OwnerApplicationResponse getMyApplication() {
        User user = getCurrentUser();
        return ownerApplicationRepository.findFirstByUserIdOrderByApplicationIdDesc(user.getUserID())
                .map(this::mapApplication)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public OwnerApplicationResponse getMyApplication(Integer applicationId) {
        User user = getCurrentUser();
        OwnerApplication application = getApplication(applicationId);
        if (!application.getUserId().equals(user.getUserID())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot view this owner application.");
        }
        return mapApplication(application);
    }

    @Transactional(readOnly = true)
    public OwnerApplicationResponse getAdminApplication(Integer applicationId) {
        return mapApplication(getApplication(applicationId));
    }

    @Transactional(readOnly = true)
    public List<OwnerApplicationResponse> getApplicationsByStatus(String status) {
        String normalizedStatus = parseStatus(status);
        List<OwnerApplication> applications = normalizedStatus == null
                ? ownerApplicationRepository.findAllByOrderBySubmittedAtDesc()
                : ownerApplicationRepository.findByStatusOrderBySubmittedAtDesc(normalizedStatus);

        return applications.stream()
                .map(this::mapApplication)
                .toList();
    }

    @Transactional
    public OwnerApplicationResponse approveApplication(
            Integer applicationId,
            AdminRoleApprovalRequest approvalRequest
    ) {
        User admin = getCurrentUser();
        OwnerApplication application = getApplication(applicationId);
        if (!STATUS_PENDING.equals(application.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending applications can be approved.");
        }

        User applicant = userRepository.findById(application.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Applicant not found."));
        Role ownerRole = roleRepository.findByRoleName(ROLE_OWNER)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "OWNER role is not initialized."));

        application.setStatus(STATUS_APPROVED);
        application.setRejectReason(null);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(admin.getUserID());
        applicant.setRole(ownerRole);
        applicant.setAccountType(ROLE_OWNER);

        ownerApplicationRepository.save(application);
        userRepository.save(applicant);

        ownerProfileRepository.findById(applicant.getUserID())
                .orElseGet(() -> ownerProfileRepository.save(OwnerProfile.builder()
                        .ownerId(applicant.getUserID())
                        .applicationId(application.getApplicationId())
                        .build()));

        return mapApplication(application);
    }

    @Transactional
    public OwnerApplicationResponse rejectApplication(Integer applicationId, String rejectReason) {
        User admin = getCurrentUser();
        if (rejectReason == null || rejectReason.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reject reason is required.");
        }

        OwnerApplication application = getApplication(applicationId);
        if (!STATUS_PENDING.equals(application.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending applications can be rejected.");
        }

        application.setStatus(STATUS_REJECTED);
        application.setRejectReason(rejectReason.trim());
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(admin.getUserID());
        return mapApplication(ownerApplicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public OwnerProfileResponse getMyOwnerProfile() {
        User owner = getCurrentUser();
        OwnerProfile profile = ownerProfileRepository.findById(owner.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Owner profile not found."));
        OwnerApplication application = getApplication(profile.getApplicationId());
        return mapProfile(profile, application, owner);
    }

    @Transactional(readOnly = true)
    public OwnerProfileResponse getAdminOwnerProfile(Integer ownerId) {
        // FLOW: Admin Registration Entity Detail Popup
        // ORDER: 5OWNER/6 - Service validates OWNER identity/profile evidence and maps the read-only owner detail response.
        // Validation: clicked user must exist and have OWNER role; profile/application evidence must be available.
        // DB effect: read-only User + OwnerProfile/OwnerApplication lookup mapped to OwnerProfileResponse.
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Owner not found."));

        if (owner.getRole() == null || !ROLE_OWNER.equals(owner.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User is not an owner.");
        }

        OwnerProfile profile = ownerProfileRepository.findById(ownerId).orElse(null);
        OwnerApplication application = profile == null
                ? ownerApplicationRepository.findFirstByUserIdOrderByApplicationIdDesc(ownerId)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Owner application not found."))
                : getApplication(profile.getApplicationId());

        return mapProfileFromApplication(
                ownerId,
                profile != null ? profile.getApplicationId() : application.getApplicationId(),
                application,
                owner,
                profile != null ? profile.getCreatedAt() : application.getReviewedAt()
        );
    }

    private OwnerApplication getApplication(Integer applicationId) {
        return ownerApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Owner application not found."));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "User is not authenticated.");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Current user not found."));
    }

    private OwnerApplicationResponse mapApplication(OwnerApplication application) {
        User user = userRepository.findById(application.getUserId()).orElse(null);
        return OwnerApplicationResponse.builder()
                .applicationId(application.getApplicationId())
                .userId(application.getUserId())
                .username(user != null ? user.getUsername() : null)
                .email(user != null ? user.getEmail() : null)
                .phone(user != null ? user.getPhone() : null)
                .stableName(application.getStableName())
                .stableAddress(application.getStableAddress())
                .stableCertificateUrl(application.getStableCertificateUrl())
                .totalHorsesOwned(application.getTotalHorsesOwned())
                .horseOwnershipProofUrl(application.getHorseOwnershipProofUrl())
                .status(application.getStatus())
                .rejectReason(application.getRejectReason())
                .submittedAt(application.getSubmittedAt())
                .reviewedAt(application.getReviewedAt())
                .reviewedBy(application.getReviewedBy())
                .build();
    }

    private OwnerProfileResponse mapProfile(OwnerProfile profile, OwnerApplication application, User owner) {
        return mapProfileFromApplication(
                profile.getOwnerId(),
                profile.getApplicationId(),
                application,
                owner,
                profile.getCreatedAt()
        );
    }

    private OwnerProfileResponse mapProfileFromApplication(
            Integer ownerId,
            Integer applicationId,
            OwnerApplication application,
            User owner,
            LocalDateTime ownerSince
    ) {
        return OwnerProfileResponse.builder()
                .ownerId(ownerId)
                .applicationId(applicationId)
                .username(owner.getUsername())
                .email(owner.getEmail())
                .phone(owner.getPhone())
                .stableName(application.getStableName())
                .stableAddress(application.getStableAddress())
                .stableCertificateUrl(application.getStableCertificateUrl())
                .totalHorsesOwned(application.getTotalHorsesOwned())
                .horseOwnershipProofUrl(application.getHorseOwnershipProofUrl())
                .status(application.getStatus())
                .submittedAt(application.getSubmittedAt())
                .reviewedAt(application.getReviewedAt())
                .ownerSince(ownerSince)
                .build();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private String effectiveAccountType(User user) {
        if (user.getAccountType() != null && !user.getAccountType().isBlank()) {
            return user.getAccountType().trim().toUpperCase(Locale.ROOT);
        }
        return user.getRole() == null ? null : user.getRole().getRoleName();
    }

    private String normalizeUppercase(String value) {
        String normalizedValue = normalizeText(value);
        return normalizedValue == null ? null : normalizedValue.toUpperCase(Locale.ROOT);
    }

    private String parseStatus(String status) {
        String normalizedStatus = normalizeUppercase(status);
        if (normalizedStatus == null || normalizedStatus.isBlank() || "ALL".equals(normalizedStatus)) {
            return null;
        }
        if (!STATUS_PENDING.equals(normalizedStatus)
                && !STATUS_APPROVED.equals(normalizedStatus)
                && !STATUS_REJECTED.equals(normalizedStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid owner application status.");
        }
        return normalizedStatus;
    }

    private void validateFile(MultipartFile file, String message) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
    }
}
