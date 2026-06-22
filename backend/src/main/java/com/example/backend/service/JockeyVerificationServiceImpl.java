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
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.JockeyVerification;
import com.example.backend.entity.JockeyVerificationFile;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyProfileRepository;
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

    private final JockeyVerificationRepository verificationRepository;
    private final JockeyVerificationFileRepository verificationFileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JockeyProfileRepository jockeyProfileRepository;

    public JockeyVerificationServiceImpl(
            JockeyVerificationRepository verificationRepository,
            JockeyVerificationFileRepository verificationFileRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            JockeyProfileRepository jockeyProfileRepository) {
        this.verificationRepository = verificationRepository;
        this.verificationFileRepository = verificationFileRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
    }

    @Transactional
    @Override
    public ApiResponse<JockeyVerificationResponse> submitVerification(JockeyVerificationRequest request) {
        User user = getCurrentUserForVerification();
        log.info("Người dùng {} đang gửi yêu cầu xác minh để trở thành Jockey.", user.getEmail());

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
                .weight(request.getWeight())
                .ranking(normalizeUppercase(request.getRanking()))
                .biography(normalizeText(request.getBiography()))
                .verificationStatus(STATUS_PENDING)
                .resubmitCount(0)
                .build();

        JockeyVerification saved = verificationRepository.save(verification);
        List<JockeyVerificationFile> files = saveVerificationFiles(saved.getVerificationId(), request.getFiles());

        // Tài khoản vẫn giữ trạng thái ACTIVE, không thay đổi status của User
        log.info("Yêu cầu xác minh #{} đã được tạo cho người dùng {}.", saved.getVerificationId(), user.getEmail());
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Gửi yêu cầu xác minh thành công")
                .data(mapToResponse(saved, user, files))
                .build();
    }

    @Transactional
    @Override
    public ApiResponse<JockeyVerificationResponse> resubmitVerification(Integer verificationId, JockeyVerificationRequest request) {
        User user = getCurrentUserForVerification();
        log.info("Người dùng {} đang gửi lại yêu cầu xác minh #{}.", user.getEmail(), verificationId);

        JockeyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Yêu cầu xác minh không tồn tại."));

        if (!verification.getJockeyId().equals(user.getUserID())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền cập nhật yêu cầu xác minh này.");
        }

        if (!STATUS_REJECTED.equals(verification.getVerificationStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể gửi lại yêu cầu xác minh đã bị từ chối.");
        }

        verification.setTrainerName(normalizeText(request.getTrainerName()));
        verification.setTrainerEmail(normalizeText(request.getTrainerEmail()));
        verification.setAcademyStableAddress(normalizeText(request.getAcademyStableAddress()));
        verification.setIssuingAuthority(normalizeText(request.getIssuingAuthority()));
        verification.setVerificationLink(normalizeText(request.getVerificationLink()));
        verification.setLicenceType(normalizeUppercase(request.getLicenceType()));
        verification.setExpiryDate(request.getExpiryDate());
        verification.setWeight(request.getWeight());
        verification.setRanking(normalizeUppercase(request.getRanking()));
        verification.setBiography(normalizeText(request.getBiography()));
        verification.setVerificationStatus(STATUS_PENDING);
        verification.setRejectionReason(null);
        verification.setResubmitCount(verification.getResubmitCount() + 1);
        verification.setSubmittedAt(LocalDateTime.now());
        verification.setReviewedAt(null);
        verification.setReviewedBy(null);

        JockeyVerification saved = verificationRepository.save(verification);

        verificationFileRepository.deleteByVerificationId(verificationId);
        List<JockeyVerificationFile> files = saveVerificationFiles(verificationId, request.getFiles());

        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Gửi lại yêu cầu xác minh thành công")
                .data(mapToResponse(saved, user, files))
                .build();
    }

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

    @Transactional
    @Override
    public ApiResponse<JockeyVerificationResponse> approveVerification(Integer verificationId) {
        User admin = getCurrentAdmin();
        JockeyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Yêu cầu xác minh không tồn tại."));

        if (!STATUS_PENDING.equals(verification.getVerificationStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể phê duyệt yêu cầu xác minh đang ở trạng thái PENDING.");
        }

        verification.setVerificationStatus(STATUS_APPROVED);
        verification.setReviewedAt(LocalDateTime.now());
        verification.setReviewedBy(admin.getUserID());
        JockeyVerification saved = verificationRepository.save(verification);

        User user = userRepository.findById(verification.getJockeyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));
        
        // Đổi Role sang JOCKEY khi được APPROVED
        Role jockeyRole = roleRepository.findByRoleName(ROLE_JOCKEY)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Vai trò JOCKEY chưa được khởi tạo."));
        
        user.setRole(jockeyRole);
        userRepository.save(user);

        // Tự động tạo hoặc cập nhật JockeyProfile
        JockeyProfile profile = jockeyProfileRepository.findById(user.getUserID())
                .orElse(new JockeyProfile());
        profile.setJockeyId(user.getUserID());
        profile.setWeight(verification.getWeight());
        profile.setRanking(verification.getRanking());
        profile.setBiography(verification.getBiography());
        jockeyProfileRepository.save(profile);

        List<JockeyVerificationFile> files = verificationFileRepository
                .findByVerificationId(verificationId);

        log.info("Yêu cầu xác minh #{} đã được phê duyệt. Người dùng {} nâng cấp sang role JOCKEY.",
                verificationId, user.getEmail());
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Phê duyệt và nâng cấp người dùng thành Jockey thành công")
                .data(mapToResponse(saved, user, files))
                .build();
    }

    @Transactional
    @Override
    public ApiResponse<JockeyVerificationResponse> rejectVerification(Integer verificationId, String rejectionReason) {
        User admin = getCurrentAdmin();
        JockeyVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Yêu cầu xác minh không tồn tại."));

        if (!STATUS_PENDING.equals(verification.getVerificationStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể từ chối yêu cầu xác minh đang ở trạng thái PENDING.");
        }

        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lý do từ chối là bắt buộc.");
        }

        verification.setVerificationStatus(STATUS_REJECTED);
        verification.setRejectionReason(rejectionReason.trim());
        verification.setReviewedAt(LocalDateTime.now());
        verification.setReviewedBy(admin.getUserID());
        JockeyVerification saved = verificationRepository.save(verification);

        // Khi bị REJECTED, User vẫn giữ Role cũ (SPECTATOR) và vẫn ACTIVE
        User user = userRepository.findById(verification.getJockeyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));
        
        List<JockeyVerificationFile> files = verificationFileRepository
                .findByVerificationId(verificationId);

        log.info("Yêu cầu xác minh #{} đã bị từ chối. Người dùng {} giữ nguyên role và trạng thái ACTIVE.",
                verificationId, user.getEmail());
        return ApiResponse.<JockeyVerificationResponse>builder()
                .status(true)
                .message("Từ chối yêu cầu xác minh thành công")
                .data(mapToResponse(saved, user, files))
                .build();
    }

    private User getCurrentUserForVerification() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Người dùng chưa được xác thực.");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));
        String role = user.getRole().getRoleName();
        if (!ROLE_JOCKEY.equals(role) && !ROLE_SPECTATOR.equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ Jockey hoặc Spectator mới có thể thực hiện hành động này.");
        }
        return user;
    }

    private User getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Người dùng chưa được xác thực.");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại."));
        if (!ROLE_ADMIN.equals(user.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ quản trị viên mới có thể truy cập tài nguyên này.");
        }
        return user;
    }

    private List<JockeyVerificationFile> saveVerificationFiles(Integer verificationId, List<JockeyVerificationFileRequest> fileRequests) {
        if (fileRequests == null || fileRequests.isEmpty()) return Collections.emptyList();
        List<JockeyVerificationFile> files = fileRequests.stream()
                .map(fileReq -> JockeyVerificationFile.builder()
                        .verificationId(verificationId)
                        .fileUrl(normalizeText(fileReq.getFileUrl()))
                        .fileType(normalizeUppercase(fileReq.getFileType()))
                        .build())
                .toList();
        return verificationFileRepository.saveAll(files);
    }

    private JockeyVerificationResponse mapToResponse(JockeyVerification verification, User user, List<JockeyVerificationFile> files) {
        List<JockeyVerificationFileResponse> fileResponses = files != null ? files.stream().map(this::mapFileToResponse).toList() : Collections.emptyList();
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
                .weight(verification.getWeight())
                .ranking(verification.getRanking())
                .biography(verification.getBiography())
                .verificationStatus(verification.getVerificationStatus())
                .rejectionReason(verification.getRejectionReason())
                .resubmitCount(verification.getResubmitCount())
                .submittedAt(verification.getSubmittedAt())
                .reviewedAt(verification.getReviewedAt())
                .reviewedBy(verification.getReviewedBy())
                .files(fileResponses)
                .build();
    }

    private JockeyVerificationFileResponse mapFileToResponse(JockeyVerificationFile file) {
        return JockeyVerificationFileResponse.builder()
                .fileId(file.getFileId())
                .fileUrl(file.getFileUrl())
                .fileType(file.getFileType())
                .uploadedAt(file.getUploadedAt())
                .build();
    }

    private String normalizeText(String value) { return value == null ? null : value.trim(); }
    private String normalizeUppercase(String value) { String normalizedValue = normalizeText(value); return normalizedValue == null ? null : normalizedValue.toUpperCase(Locale.ROOT); }
}
