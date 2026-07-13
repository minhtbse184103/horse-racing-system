package com.example.backend.service;

import com.example.backend.enums.KycStatus;
import com.example.backend.dto.request.KycSubmissionRequestDTO;
import com.example.backend.dto.response.FileUploadResponse;
import com.example.backend.dto.response.KycResponseDTO;
import com.example.backend.entity.User;
import com.example.backend.entity.UserVerification;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.UserVerificationRepository;
import com.example.backend.repository.WalletRepository;
import com.example.backend.constant.WalletStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycServiceImpl implements KycService {
    private static final int MINIMUM_AGE = 18;
    private static final int VALIDITY_YEARS = 5;
    private static final String KYC_FOLDER = "kyc";
    private static final Set<String> KYC_ROLES =
            Set.of("OWNER", "SPECTATOR", "JOCKEY");

    private final UserRepository userRepository;
    private final UserVerificationRepository verificationRepository;
    private final FileUploadService fileUploadService;
    private final WalletRepository walletRepository;

    @Transactional
    public KycResponseDTO submit(String email, KycSubmissionRequestDTO request) {
        User user = getUser(email);
        validateRole(user);
        validateAdult(request.getDateOfBirth());
        validateImage(request.getIdentityFrontFile(), "Ảnh mặt trước CCCD");
        validateImage(request.getIdentityBackFile(), "Ảnh mặt sau CCCD");
        validateImage(request.getSelfieFile(), "Ảnh selfie");

        String identityNumber = request.getIdentityNumber().trim();
        if (verificationRepository.existsByIdentityNumberAndUserIdNot(
                identityNumber,
                user.getUserID()
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Số CCCD đã được sử dụng bởi tài khoản khác."
            );
        }

        UserVerification verification = verificationRepository
                .findByUserId(user.getUserID())
                .orElseGet(UserVerification::new);
        if (KycStatus.PENDING == verification.getStatus()
                || KycStatus.VERIFIED == verification.getStatus()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Hồ sơ KYC đang chờ duyệt hoặc đã được xác minh."
            );
        }

        FileUploadResponse front =
                fileUploadService.upload(request.getIdentityFrontFile(), KYC_FOLDER);
        FileUploadResponse back =
                fileUploadService.upload(request.getIdentityBackFile(), KYC_FOLDER);
        FileUploadResponse selfie =
                fileUploadService.upload(request.getSelfieFile(), KYC_FOLDER);

        verification.setUserId(user.getUserID());
        verification.setStatus(KycStatus.PENDING);
        verification.setFullName(request.getFullName().trim());
        verification.setDateOfBirth(request.getDateOfBirth());
        verification.setGender(request.getGender().trim().toUpperCase(Locale.ROOT));
        verification.setNationality(request.getNationality().trim());
        verification.setAddress(request.getAddress().trim());
        verification.setIdentityNumber(identityNumber);
        verification.setIdentityFrontUrl(front.getUrl());
        verification.setIdentityBackUrl(back.getUrl());
        verification.setSelfieUrl(selfie.getUrl());
        verification.setSubmittedAt(LocalDateTime.now());
        verification.setReviewedAt(null);
        verification.setReviewedBy(null);
        verification.setRejectionReason(null);
        verification.setExpiresAt(null);

        UserVerification savedVerification = verificationRepository.save(verification);
        log.info("KYC submitted. userId={}, verificationId={}",
                user.getUserID(), savedVerification.getVerificationId());
        return mapToDTO(savedVerification, user, false);
    }

    @Transactional(readOnly = true)
    public KycResponseDTO getMine(String email) {
        User user = getUser(email);
        return verificationRepository.findByUserId(user.getUserID())
                .map(verification -> mapToDTO(verification, user, false))
                .orElseGet(() -> KycResponseDTO.builder()
                        .userId(user.getUserID())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .status(KycStatus.NOT_SUBMITTED.name())
                        .build());
    }

    @Transactional(readOnly = true)
    public List<KycResponseDTO> getForAdmin(String status) {
        KycStatus normalized = normalizeStatus(status);
        List<UserVerification> verifications = normalized == null
                ? verificationRepository.findAllByOrderBySubmittedAtDesc()
                : verificationRepository.findByStatusOrderBySubmittedAtAsc(normalized);
        return verifications.stream()
                .map(verification -> mapToDTO(
                        verification,
                        userRepository.findById(verification.getUserId()).orElse(null),
                        true
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public KycResponseDTO getForAdmin(Integer verificationId) {
        UserVerification verification = getVerification(verificationId);
        return mapToDTO(
                verification,
                userRepository.findById(verification.getUserId()).orElse(null),
                true
        );
    }

    @Transactional
    public KycResponseDTO approve(Integer verificationId, String adminEmail) {
        User admin = getUser(adminEmail);
        UserVerification verification = getPendingForUpdate(verificationId);
        if (admin.getUserID().equals(verification.getUserId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Admin không được duyệt hồ sơ KYC của chính mình."
            );
        }

        verifyKycAndOpenWallet(verification, admin.getUserID());
        log.info("KYC approved and wallet opened. verificationId={}, userId={}, reviewedBy={}",
                verificationId, verification.getUserId(), admin.getUserID());
        return mapToDTO(
                verification,
                userRepository.findById(verification.getUserId()).orElse(null),
                true
        );
    }

    @Transactional
    @Override
    public void approveUserKycAndOpenWallet(
            Integer userId,
            Integer adminId,
            Boolean confirmKycReviewed,
            LocalDateTime requestedExpiresAt
    ) {
        if (!Boolean.TRUE.equals(confirmKycReviewed)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Admin must confirm KYC review before approving this role."
            );
        }
        if (requestedExpiresAt != null && !requestedExpiresAt.isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "KYC expiry time must be in the future."
            );
        }
        UserVerification verification = verificationRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.CONFLICT,
                        "Người dùng cần gửi hồ sơ KYC trước khi được duyệt vai trò."
                ));
        if (KycStatus.PENDING == verification.getStatus()) {
            verifyKycAndOpenWallet(verification, adminId, requestedExpiresAt);
            return;
        }
        if (KycStatus.VERIFIED == verification.getStatus()) {
            if (verification.getExpiresAt() != null
                    && !verification.getExpiresAt().isAfter(LocalDateTime.now())) {
                throw new ApiException(
                        HttpStatus.CONFLICT,
                        "Hồ sơ KYC đã hết hạn."
                );
            }
            if (requestedExpiresAt != null) {
                verification.setExpiresAt(requestedExpiresAt);
                verificationRepository.save(verification);
            }
            ensureWalletOpened(userId);
            return;
        }
        throw new ApiException(
                HttpStatus.CONFLICT,
                "Chỉ có thể duyệt vai trò khi KYC đang chờ duyệt hoặc đã xác minh."
        );
    }

    @Transactional
    public KycResponseDTO reject(
            Integer verificationId,
            String reason,
            String adminEmail
    ) {
        User admin = getUser(adminEmail);
        if (reason == null || reason.isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Lý do từ chối là bắt buộc."
            );
        }
        UserVerification verification = getPendingForUpdate(verificationId);
        verification.setStatus(KycStatus.REJECTED);
        verification.setReviewedAt(LocalDateTime.now());
        verification.setReviewedBy(admin.getUserID());
        verification.setRejectionReason(reason.trim());
        verification.setExpiresAt(null);
        verificationRepository.save(verification);
        log.info("KYC rejected. verificationId={}, userId={}, reviewedBy={}",
                verificationId, verification.getUserId(), admin.getUserID());
        return mapToDTO(
                verification,
                userRepository.findById(verification.getUserId()).orElse(null),
                true
        );
    }

    private UserVerification getPendingForUpdate(Integer verificationId) {
        UserVerification verification = verificationRepository
                .findByIdForUpdate(verificationId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Hồ sơ KYC không tồn tại."
                ));
        if (KycStatus.PENDING != verification.getStatus()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Chỉ hồ sơ KYC đang chờ mới được xét duyệt."
            );
        }
        return verification;
    }

    private UserVerification getVerification(Integer verificationId) {
        return verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Hồ sơ KYC không tồn tại."
                ));
    }

    private void verifyKycAndOpenWallet(UserVerification verification, Integer adminId) {
        verifyKycAndOpenWallet(verification, adminId, null);
    }

    private void verifyKycAndOpenWallet(
            UserVerification verification,
            Integer adminId,
            LocalDateTime requestedExpiresAt
    ) {
        LocalDateTime now = LocalDateTime.now();
        verification.setStatus(KycStatus.VERIFIED);
        verification.setReviewedAt(now);
        verification.setReviewedBy(adminId);
        verification.setRejectionReason(null);
        verification.setExpiresAt(requestedExpiresAt != null
                ? requestedExpiresAt
                : now.plusYears(VALIDITY_YEARS));
        verificationRepository.save(verification);
        ensureWalletOpened(verification.getUserId());
    }

    private void ensureWalletOpened(Integer userId) {
        walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(
                        com.example.backend.entity.Wallet.builder()
                                .userId(userId)
                                .balance(java.math.BigDecimal.ZERO)
                                .lockedBalance(java.math.BigDecimal.ZERO)
                                .currency("VND")
                                .status(WalletStatus.ACTIVE)
                                .build()
                ));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Người dùng không tồn tại."
                ));
    }

    private void validateRole(User user) {
        String role = user.getRole() == null ? null : user.getRole().getRoleName();
        if (role == null || !KYC_ROLES.contains(role.toUpperCase(Locale.ROOT))) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Vai trò không được phép gửi hồ sơ KYC."
            );
        }
    }

    private void validateAdult(LocalDate dateOfBirth) {
        if (dateOfBirth == null
                || dateOfBirth.isAfter(LocalDate.now().minusYears(MINIMUM_AGE))) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Người dùng phải đủ 18 tuổi để xác minh KYC."
            );
        }
    }

    private void validateImage(MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, label + " là bắt buộc.");
        }
        String contentType = file.getContentType();
        if (!"image/jpeg".equalsIgnoreCase(contentType)
                && !"image/png".equalsIgnoreCase(contentType)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    label + " chỉ hỗ trợ JPG hoặc PNG."
            );
        }
    }

    private KycStatus normalizeStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        KycStatus normalized;
        try {
            normalized = KycStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái KYC không hợp lệ.");
        }
        if (KycStatus.NOT_SUBMITTED == normalized) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái KYC không hợp lệ.");
        }
        return normalized;
    }

    private KycResponseDTO mapToDTO(
            UserVerification verification,
            User user,
            boolean adminView
    ) {
        return KycResponseDTO.builder()
                .verificationId(verification.getVerificationId())
                .userId(verification.getUserId())
                .username(user == null ? null : user.getUsername())
                .email(user == null ? null : user.getEmail())
                .status(verification.getStatus().name())
                .fullName(verification.getFullName())
                .dateOfBirth(verification.getDateOfBirth())
                .gender(verification.getGender())
                .nationality(verification.getNationality())
                .address(verification.getAddress())
                .identityNumber(adminView
                        ? verification.getIdentityNumber()
                        : maskIdentityNumber(verification.getIdentityNumber()))
                .identityFrontUrl(verification.getIdentityFrontUrl())
                .identityBackUrl(verification.getIdentityBackUrl())
                .selfieUrl(verification.getSelfieUrl())
                .submittedAt(verification.getSubmittedAt())
                .reviewedAt(verification.getReviewedAt())
                .reviewedBy(verification.getReviewedBy())
                .rejectionReason(verification.getRejectionReason())
                .expiresAt(verification.getExpiresAt())
                .build();
    }

    private String maskIdentityNumber(String value) {
        if (value == null || value.length() <= 4) {
            return value;
        }
        return "*".repeat(value.length() - 4)
                + value.substring(value.length() - 4);
    }
}
