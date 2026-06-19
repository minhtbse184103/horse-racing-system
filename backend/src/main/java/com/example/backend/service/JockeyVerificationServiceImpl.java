package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.request.JockeyVerificationFileRequest;
import com.example.backend.dto.request.JockeyVerificationRequest;
import com.example.backend.dto.response.JockeyVerificationFileResponse;
import com.example.backend.dto.response.JockeyVerificationResponse;
import com.example.backend.entity.JockeyVerification;
import com.example.backend.entity.JockeyVerificationFile;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyVerificationFileRepository;
import com.example.backend.repository.JockeyVerificationRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class JockeyVerificationServiceImpl implements JockeyVerificationService {

    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String ROLE_SPECTATOR = "SPECTATOR";
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String USER_STATUS_UNDER_REVIEW = "UNDER_REVIEW";
    private static final String USER_STATUS_ACTIVE = "ACTIVE";
    private static final String USER_STATUS_REJECTED = "REJECTED";

    private final JockeyVerificationRepository verificationRepository;
    private final JockeyVerificationFileRepository verificationFileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public JockeyVerificationServiceImpl(
            JockeyVerificationRepository verificationRepository,
            JockeyVerificationFileRepository verificationFileRepository,
            UserRepository userRepository,
            RoleRepository roleRepository) {
        this.verificationRepository = verificationRepository;
        this.verificationFileRepository = verificationFileRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    // Người dùng gửi yêu cầu xác minh lần đầu (Jockey hoặc Spectator).
    @Transactional
    @Override
    public ApiResponse<JockeyVerificationResponse> submitVerification(JockeyVerificationRequest request) {
        User user = getCurrentUserForVerification();
        log.info("Người dùng {} đang gửi yêu cầu xác minh để trở thành Jockey.", user.getEmail());

        // Kiểm tra user chưa có yêu cầu xác minh đang PENDING.
        if (verificationRepository.existsByJockeyIdAndVerificationStatus(user.getUserID(), STATUS_PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Bạn đã có yêu cầu xác minh đang chờ duyệt. Vui lòng chờ admin xét duyệt.");
        }

        JockeyVerification verification = JockeyVerification.builder()
                .jockeyId(user.getUserID())
                .trainerName(normalizeText(request.getTrainerName()))
                .trainerEmail(normalizeText(request.getTrainerEmail()))
                .academyStableAddress(normalizeText(request.getAcademyStableAddress()))
                .issuingAuthority(normalizeText(request.getIssuingAuthority()))
                .verificationLink(normalizeText(request.getVerificationLink()))
                .licenceType(normalizeUppercase(request.getLicenceType()))
                .expiryDate(request.getExpiryDate())
                .verificationStatus(STATUS_PENDING)
                .resubmitCount(0)
                .build();

        JockeyVerification saved = verificationRepository.save(verification);
        List<JockeyVerificationFile> files = saveVerificationFiles(saved.getVerificationId(), request.getFiles());

        // Cập nhật trạng thái user sang UNDER_REVIEW.
        user.setStatus(USER_STATUS_UNDER_REVIEW);
        userRepository.save(user);

        log.info("Yêu cầu xác minh #{} đã được tạo cho người dùng {}.", saved.getVerificationId(), user.getEmail());
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Gửi yêu cầu xác minh thành công")
                .data(mapToResponse(saved, user, files))
                .build();
    }

    // Người dùng cập nhật và gửi lại sau khi bị từ chối.
    @Transactional
    @Override
    public ApiResponse<JockeyVerificationResponse> resubmitVerification(Integer verificationId, JockeyVerificationRequest request) {
        User user = getCurrentUserForVerification();
        log.info("Người dùng {} đang gửi lại yêu cầu xác minh #{}.", user.getEmail(), verificationId);

        JockeyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Yêu cầu xác minh không tồn tại."));

        // Đảm bảo verification thuộc user hiện tại.
        if (!verification.getJockeyId().equals(user.getUserID())) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền cập nhật yêu cầu xác minh này.");
        }

        // Chỉ cho phép resubmit khi bị REJECTED.
        if (!STATUS_REJECTED.equals(verification.getVerificationStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chỉ có thể gửi lại yêu cầu xác minh đã bị từ chối.");
        }

        // Cập nhật thông tin verification.
        verification.setTrainerName(normalizeText(request.getTrainerName()));
        verification.setTrainerEmail(normalizeText(request.getTrainerEmail()));
        verification.setAcademyStableAddress(normalizeText(request.getAcademyStableAddress()));
        verification.setIssuingAuthority(normalizeText(request.getIssuingAuthority()));
        verification.setVerificationLink(normalizeText(request.getVerificationLink()));
        verification.setLicenceType(normalizeUppercase(request.getLicenceType()));
        verification.setExpiryDate(request.getExpiryDate());
        verification.setVerificationStatus(STATUS_PENDING);
        verification.setRejectionReason(null);
        verification.setResubmitCount(verification.getResubmitCount() + 1);
        verification.setSubmittedAt(LocalDateTime.now());
        verification.setReviewedAt(null);
        verification.setReviewedBy(null);

        JockeyVerification saved = verificationRepository.save(verification);

        // Xóa file cũ và lưu file mới.
        verificationFileRepository.deleteByVerificationId(verificationId);
        List<JockeyVerificationFile> files = saveVerificationFiles(verificationId, request.getFiles());

        // Cập nhật trạng thái user sang UNDER_REVIEW.
        user.setStatus(USER_STATUS_UNDER_REVIEW);
        userRepository.save(user);

        log.info("Yêu cầu xác minh #{} đã được gửi lại bởi người dùng {}.", verificationId, user.getEmail());
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Gửi lại yêu cầu xác minh thành công")
                .data(mapToResponse(saved, user, files))
                .build();
    }

    // Người dùng xem trạng thái xác minh mới nhất.
    @Transactional(readOnly = true)
    @Override
    public ApiResponse<JockeyVerificationResponse> getMyVerification() {
        User user = getCurrentUserForVerification();
        JockeyVerification verification = verificationRepository
                .findFirstByJockeyIdOrderByCreatedAtDesc(user.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "Bạn chưa có yêu cầu xác minh nào."));

        List<JockeyVerificationFile> files = verificationFileRepository
                .findByVerificationId(verification.getVerificationId());
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Lấy trạng thái xác minh thành công")
                .data(mapToResponse(verification, user, files))
                .build();
    }

    // Người dùng xem toàn bộ lịch sử xác minh.
    @Transactional(readOnly = true)
    @Override
    public ApiResponse<List<JockeyVerificationResponse>> getMyVerificationHistory() {
        User user = getCurrentUserForVerification();
        List<JockeyVerification> verifications = verificationRepository
                .findByJockeyIdOrderByCreatedAtDesc(user.getUserID());
        List<JockeyVerificationResponse> history = verifications.stream()
                .map(v -> {
                    List<JockeyVerificationFile> files = verificationFileRepository
                            .findByVerificationId(v.getVerificationId());
                    return mapToResponse(v, user, files);
                })
                .toList();
        return ApiResponse.<List<JockeyVerificationResponse>>builder()
                .status(true)
                .message("Lấy lịch sử xác minh thành công")
                .data(history)
                .build();
    }

    // Admin lấy danh sách đang chờ duyệt.
    @Transactional(readOnly = true)
    @Override
    public ApiResponse<List<JockeyVerificationResponse>> getPendingVerifications() {
        List<JockeyVerification> verifications = verificationRepository
                .findByVerificationStatusOrderBySubmittedAtAsc(STATUS_PENDING);
        List<JockeyVerificationResponse> pending = verifications.stream()
                .map(v -> {
                    User applicant = userRepository.findById(v.getJockeyId()).orElse(null);
                    List<JockeyVerificationFile> files = verificationFileRepository
                            .findByVerificationId(v.getVerificationId());
                    return mapToResponse(v, applicant, files);
                })
                .toList();
        return ApiResponse.<List<JockeyVerificationResponse>>builder()
                .status(true)
                .message("Lấy danh sách yêu cầu xác minh đang chờ duyệt thành công")
                .data(pending)
                .build();
    }

    // Admin xem chi tiết một yêu cầu xác minh.
    @Transactional(readOnly = true)
    @Override
    public ApiResponse<JockeyVerificationResponse> getVerificationById(Integer verificationId) {
        JockeyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Yêu cầu xác minh không tồn tại."));
        User applicant = userRepository.findById(verification.getJockeyId()).orElse(null);
        List<JockeyVerificationFile> files = verificationFileRepository
                .findByVerificationId(verificationId);
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Lấy chi tiết yêu cầu xác minh thành công")
                .data(mapToResponse(verification, applicant, files))
                .build();
    }

    // Admin phê duyệt yêu cầu xác minh và nâng cấp role user.
    @Transactional
    @Override
    public ApiResponse<JockeyVerificationResponse> approveVerification(Integer verificationId) {
        User admin = getCurrentAdmin();
        log.info("Admin {} đang phê duyệt yêu cầu xác minh #{}.", admin.getEmail(), verificationId);

        JockeyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Yêu cầu xác minh không tồn tại."));

        if (!STATUS_PENDING.equals(verification.getVerificationStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chỉ có thể phê duyệt yêu cầu xác minh đang ở trạng thái PENDING.");
        }

        verification.setVerificationStatus(STATUS_APPROVED);
        verification.setRejectionReason(null);
        verification.setReviewedAt(LocalDateTime.now());
        verification.setReviewedBy(admin.getUserID());
        JockeyVerification saved = verificationRepository.save(verification);

        // Nâng cấp role user sang JOCKEY và trạng thái sang ACTIVE.
        User user = userRepository.findById(verification.getJockeyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));
        
        Role jockeyRole = roleRepository.findByRoleName(ROLE_JOCKEY)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Vai trò JOCKEY chưa được khởi tạo."));
        
        user.setRole(jockeyRole);
        user.setStatus(USER_STATUS_ACTIVE);
        userRepository.save(user);

        List<JockeyVerificationFile> files = verificationFileRepository
                .findByVerificationId(verificationId);

        log.info("Yêu cầu xác minh #{} đã được phê duyệt. Người dùng {} nâng cấp sang role JOCKEY và ACTIVE.",
                verificationId, user.getEmail());
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Phê duyệt yêu cầu xác minh và nâng cấp người dùng thành Jockey thành công")
                .data(mapToResponse(saved, user, files))
                .build();
    }

    // Admin từ chối yêu cầu xác minh.
    @Transactional
    @Override
    public ApiResponse<JockeyVerificationResponse> rejectVerification(Integer verificationId, String rejectionReason) {
        User admin = getCurrentAdmin();
        log.info("Admin {} đang từ chối yêu cầu xác minh #{}.", admin.getEmail(), verificationId);

        JockeyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Yêu cầu xác minh không tồn tại."));

        if (!STATUS_PENDING.equals(verification.getVerificationStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chỉ có thể từ chối yêu cầu xác minh đang ở trạng thái PENDING.");
        }

        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lý do từ chối là bắt buộc.");
        }

        verification.setVerificationStatus(STATUS_REJECTED);
        verification.setRejectionReason(rejectionReason.trim());
        verification.setReviewedAt(LocalDateTime.now());
        verification.setReviewedBy(admin.getUserID());
        JockeyVerification saved = verificationRepository.save(verification);

        // Cập nhật trạng thái user sang REJECTED (vẫn giữ role cũ).
        User user = userRepository.findById(verification.getJockeyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));
        user.setStatus(USER_STATUS_REJECTED);
        userRepository.save(user);

        List<JockeyVerificationFile> files = verificationFileRepository
                .findByVerificationId(verificationId);

        log.info("Yêu cầu xác minh #{} đã bị từ chối. Người dùng {} chuyển trạng thái sang REJECTED.",
                verificationId, user.getEmail());
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Từ chối yêu cầu xác minh thành công")
                .data(mapToResponse(saved, user, files))
                .build();
    }

    // ===== PRIVATE HELPER METHODS =====

    // Lấy user từ JWT và kiểm tra role (JOCKEY hoặc SPECTATOR).
    private User getCurrentUserForVerification() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Người dùng chưa được xác thực.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));

        if (user.getRole() == null || (!ROLE_JOCKEY.equals(user.getRole().getRoleName()) && !ROLE_SPECTATOR.equals(user.getRole().getRoleName()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ Jockey hoặc Spectator mới có thể thực hiện hành động này.");
        }

        return user;
    }

    // Lấy user admin từ JWT và kiểm tra role.
    private User getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Người dùng chưa được xác thực.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));

        if (user.getRole() == null || !ROLE_ADMIN.equals(user.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ quản trị viên mới có thể truy cập tài nguyên này.");
        }

        return user;
    }

    // Lưu danh sách file đính kèm cho verification.
    private List<JockeyVerificationFile> saveVerificationFiles(
            Integer verificationId, List<JockeyVerificationFileRequest> fileRequests) {
        if (fileRequests == null || fileRequests.isEmpty()) {
            return Collections.emptyList();
        }

        List<JockeyVerificationFile> files = fileRequests.stream()
                .map(fileReq -> JockeyVerificationFile.builder()
                        .verificationId(verificationId)
                        .fileUrl(normalizeText(fileReq.getFileUrl()))
                        .fileType(normalizeUppercase(fileReq.getFileType()))
                        .build())
                .toList();

        return verificationFileRepository.saveAll(files);
    }

    // Chuyển entity sang response DTO.
    private JockeyVerificationResponse mapToResponse(
            JockeyVerification verification, User user, List<JockeyVerificationFile> files) {
        List<JockeyVerificationFileResponse> fileResponses = files != null
                ? files.stream().map(this::mapFileToResponse).toList()
                : Collections.emptyList();

        return JockeyVerificationResponse.builder()
                .verificationId(verification.getVerificationId())
                .jockeyId(verification.getJockeyId())
                .jockeyFullName(user != null ? user.getFullName() : null)
                .jockeyEmail(user != null ? user.getEmail() : null)
                .trainerName(verification.getTrainerName())
                .trainerEmail(verification.getTrainerEmail())
                .academyStableAddress(verification.getAcademyStableAddress())
                .issuingAuthority(verification.getIssuingAuthority())
                .verificationLink(verification.getVerificationLink())
                .licenceType(verification.getLicenceType())
                .expiryDate(verification.getExpiryDate())
                .verificationStatus(verification.getVerificationStatus())
                .rejectionReason(verification.getRejectionReason())
                .resubmitCount(verification.getResubmitCount())
                .submittedAt(verification.getSubmittedAt())
                .reviewedAt(verification.getReviewedAt())
                .reviewedBy(verification.getReviewedBy())
                .files(fileResponses)
                .build();
    }

    // Chuyển entity file sang response DTO.
    private JockeyVerificationFileResponse mapFileToResponse(JockeyVerificationFile file) {
        return JockeyVerificationFileResponse.builder()
                .fileId(file.getFileId())
                .fileUrl(file.getFileUrl())
                .fileType(file.getFileType())
                .uploadedAt(file.getUploadedAt())
                .build();
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeUppercase(String value) {
        String normalizedValue = normalizeText(value);
        return normalizedValue == null ? null : normalizedValue.toUpperCase(Locale.ROOT);
    }
}
