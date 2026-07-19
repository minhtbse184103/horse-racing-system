package com.example.backend.service;

import com.example.backend.client.DiditClient;
import com.example.backend.config.DiditProperties;
import com.example.backend.dto.response.KycResponseDTO;
import com.example.backend.dto.response.KycSessionResponse;
import com.example.backend.entity.*;
import com.example.backend.enums.KycStatus;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycServiceImpl implements KycService {
    private static final String PROVIDER = "DIDIT";
    private static final String SPECTATOR = "SPECTATOR";
    private static final Set<KycStatus> ACTIVE_STATUSES = EnumSet.of(
            KycStatus.NOT_STARTED, KycStatus.IN_PROGRESS, KycStatus.AWAITING_USER,
            KycStatus.IN_REVIEW, KycStatus.RESUBMITTED);

    private final UserRepository userRepository;
    private final UserVerificationRepository verificationRepository;
    private final DiditWebhookEventRepository webhookEventRepository;
    private final WalletRepository walletRepository;
    private final DiditClient diditClient;
    private final DiditProperties properties;
    private final DiditWebhookVerifier webhookVerifier;
    private final WalletProvisioningService walletProvisioningService;

    @Override
    @Transactional
    public KycSessionResponse createSession(String email) {
        // Lấy user, lock user trong DB và chỉ cho tài khoản Spectator thực sự bắt đầu KYC.
        User user = getUser(email);
        userRepository.findByIdForUpdate(user.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        validateEligibleUser(user);

        // Nếu đã có session KYC đang xử lý thì tái sử dụng, không tạo session mới.
        List<UserVerification> active = verificationRepository.findActiveByUserId(user.getUserID(), ACTIVE_STATUSES);
        if (!active.isEmpty()) return sessionResponse(active.get(0), true);

        // Nếu đã verified và chưa hết hạn thì dùng lại kết quả KYC cũ.
        UserVerification verified = verificationRepository
                .findFirstByUserIdAndStatusOrderByAttemptNumberDesc(user.getUserID(), KycStatus.VERIFIED)
                .orElse(null);
        if (verified != null && !isExpired(verified)) return sessionResponse(verified, true);

        // Gọi Didit tạo session xác thực định danh.
        JsonNode created;
        try {
            created = diditClient.createSession("user-" + user.getUserID());
        } catch (IllegalStateException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
        }
        String sessionId = requiredText(created, "session_id");
        String verificationUrl = firstText(created, "verification_url", "url");
        if (verificationUrl == null) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Didit did not return a verification URL.");
        }

        // Lưu session KYC mới vào DB để đối chiếu khi webhook trả về.
        UserVerification verification = UserVerification.builder()
                .userId(user.getUserID()).provider(PROVIDER).providerSessionId(sessionId)
                .providerSessionNumber(longValue(created, "session_number"))
                .workflowId(properties.getWorkflowId()).vendorData("user-" + user.getUserID())
                .verificationUrl(verificationUrl).status(KycStatus.NOT_STARTED)
                .attemptNumber(Optional.ofNullable(verificationRepository.findMaxAttemptNumber(user.getUserID())).orElse(0) + 1)
                .submittedAt(LocalDateTime.now()).build();
        verificationRepository.save(verification);
        log.info("Didit KYC session created. userId={}, verificationId={}", user.getUserID(), verification.getVerificationId());
        return sessionResponse(verification, false);
    }

    @Override
    @Transactional(readOnly = true)
    public KycResponseDTO getMine(String email) {
        // Lấy trạng thái KYC mới nhất của Spectator hiện tại.
        User user = getUser(email);
        validateEligibleUser(user);
        return verificationRepository.findFirstByUserIdOrderByAttemptNumberDesc(user.getUserID())
                .map(this::response)
                .orElseGet(() -> KycResponseDTO.builder().provider(PROVIDER)
                        .status("NOT_SUBMITTED").walletOpen(walletRepository.findByUserId(user.getUserID()).isPresent()).build());
    }

    @Override
    @Transactional
    public void processWebhook(byte[] rawBody, String timestamp, String signatureV2,
                               String rawSignature, String simpleSignature, boolean testWebhook) {
        JsonNode webhook = webhookVerifier.verify(rawBody, timestamp, signatureV2, rawSignature, simpleSignature);
        if (testWebhook) return;

        String eventId = requiredText(webhook, "event_id");
        String sessionId = requiredText(webhook, "session_id");
        int inserted = webhookEventRepository.insertIfAbsent(eventId, sessionId,
                firstText(webhook, "webhook_type", "event_type"), firstText(webhook, "status"));
        if (inserted == 0) return;
        DiditWebhookEvent event = webhookEventRepository.findByEventId(eventId)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Webhook event was not persisted."));

        try {
            JsonNode decision = diditClient.retrieveDecision(sessionId);
            applyDecision(sessionId, decision);
            event.setProcessedAt(LocalDateTime.now());
        } catch (RuntimeException exception) {
            event.setProcessingError(truncate(exception.getMessage(), 500));
            webhookEventRepository.save(event);
            throw exception;
        }
        webhookEventRepository.save(event);
    }

    private void applyDecision(String sessionId, JsonNode decision) {
        // Tìm session KYC từ DB, lock user và hồ sơ để cập nhật kết quả an toàn.
        UserVerification session = verificationRepository.findByProviderSessionId(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unknown Didit session."));
        User user = userRepository.findByIdForUpdate(session.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        validateEligibleUser(user);
        UserVerification verification = verificationRepository.findByProviderSessionIdForUpdate(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Unknown Didit session."));
        // Đối chiếu dữ liệu webhook với dữ liệu đã lưu để tránh nhận nhầm session.
        requireEqual(sessionId, requiredText(decision, "session_id"), "Didit session mismatch.");
        requireEqual(verification.getVendorData(), requiredText(decision, "vendor_data"), "Didit vendor data mismatch.");
        requireEqual(verification.getWorkflowId(), requiredText(decision, "workflow_id"), "Didit workflow mismatch.");

        String kind = firstText(decision, "session_kind", "kind");
        if (kind != null && !"KYC".equals(kind) && !"user".equals(kind)) {
            throw new ApiException(HttpStatus.CONFLICT, "Unexpected Didit session kind.");
        }
        String environment = firstText(decision, "environment");
        if (!properties.getExpectedEnvironment().isBlank() && environment != null) {
            requireEqual(properties.getExpectedEnvironment(), environment, "Didit environment mismatch.");
        }

        // Map trạng thái từ Didit sang trạng thái KYC nội bộ.
        String providerStatus = requiredText(decision, "status");
        KycStatus mapped = mapStatus(providerStatus);
        if (mapped != KycStatus.VERIFIED) {
            // Nếu chưa verified hoặc bị reject thì lưu trạng thái và lý do rồi dừng.
            verification.setStatus(mapped);
            verification.setRejectionReason(mapped == KycStatus.REJECTED
                    ? truncate(firstText(decision, "decline_reason", "reason"), 500) : null);
            verificationRepository.save(verification);
            return;
        }

        // Khi verified, tất cả feature bắt buộc phải được Approved.
        Map<String, String> features = extractFeatures(decision);
        for (String required : properties.getRequiredFeatures()) {
            if (!"Approved".equals(features.get(required))) {
                throw new ApiException(HttpStatus.CONFLICT, "Required Didit feature is not approved: " + required);
            }
        }

        // Lưu thông tin giấy tờ đã xác minh vào hồ sơ KYC.
        JsonNode document = firstArrayItem(decision, "id_verifications", "document_verifications");
        verification.setIdVerificationStatus(features.get("ID_VERIFICATION"));
        verification.setLivenessStatus(features.get("LIVENESS"));
        verification.setFaceMatchStatus(features.get("FACE_MATCH"));
        verification.setIpAnalysisStatus(features.get("IP_ANALYSIS"));
        verification.setVerifiedFullName(extractFullName(document));
        verification.setVerifiedDateOfBirth(dateValue(document, "date_of_birth", "dob"));
        verification.setDocumentType(firstText(document, "document_type", "type"));
        String number = firstText(document, "document_number", "number");
        verification.setDocumentLastFour(number == null ? null : number.substring(Math.max(0, number.length() - 4)));
        LocalDate documentExpiry = dateValue(document, "expiration_date", "expiry_date");
        verification.setDocumentExpiryDate(documentExpiry);
        verification.setExpiresAt(documentExpiry == null ? null : documentExpiry.atTime(LocalTime.MAX));
        verification.setFaceMatchScore(decimalValue(firstArrayItem(decision, "face_matches"), "score"));
        verification.setStatus(KycStatus.VERIFIED);
        verification.setVerifiedAt(LocalDateTime.now());
        verification.setRejectionReason(null);
        verificationRepository.save(verification);
        // Sau KYC thành công, mở ví cho Spectator nếu chưa có.
        openWalletIfAbsent(verification.getUserId());
        log.info("Didit KYC verified and wallet opened. userId={}, verificationId={}",
                verification.getUserId(), verification.getVerificationId());
    }

    private void openWalletIfAbsent(Integer userId) {
        // Lock user và validate role trước khi tạo wallet.
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        validateEligibleUser(user);
        walletProvisioningService.provisionForVerifiedSpectator(user);
    }

    private Map<String, String> extractFeatures(JsonNode decision) {
        Map<String, String> result = new HashMap<>();
        result.put("ID_VERIFICATION", featureStatus(decision, "id_verifications", "document_verifications"));
        result.put("LIVENESS", featureStatus(decision, "liveness_checks", "liveness"));
        result.put("FACE_MATCH", featureStatus(decision, "face_matches"));
        result.put("IP_ANALYSIS", featureStatus(decision, "ip_analyses", "ip_analysis"));
        return result;
    }

    private String featureStatus(JsonNode root, String... names) {
        JsonNode item = firstArrayItem(root, names);
        return firstText(item, "status", "decision");
    }

    private JsonNode firstArrayItem(JsonNode root, String... names) {
        if (root == null) return null;
        for (String name : names) {
            JsonNode value = root.path(name);
            if (value.isArray() && !value.isEmpty()) return value.get(0);
            if (value.isObject()) return value;
        }
        return null;
    }

    private String extractFullName(JsonNode document) {
        String full = firstText(document, "full_name", "fullName");
        if (full != null) return truncate(full, 150);
        String first = firstText(document, "first_name");
        String last = firstText(document, "last_name");
        String combined = String.join(" ", first == null ? "" : first, last == null ? "" : last).trim();
        return combined.isEmpty() ? null : truncate(combined, 150);
    }

    private KycStatus mapStatus(String status) {
        return switch (status) {
            case "Not Started" -> KycStatus.NOT_STARTED;
            case "In Progress" -> KycStatus.IN_PROGRESS;
            case "Awaiting User" -> KycStatus.AWAITING_USER;
            case "In Review" -> KycStatus.IN_REVIEW;
            case "Approved" -> KycStatus.VERIFIED;
            case "Declined" -> KycStatus.REJECTED;
            case "Resubmitted" -> KycStatus.RESUBMITTED;
            case "Expired", "Kyc Expired" -> KycStatus.EXPIRED;
            case "Abandoned" -> KycStatus.ABANDONED;
            default -> throw new ApiException(HttpStatus.CONFLICT, "Unknown Didit status.");
        };
    }

    private void validateEligibleUser(User user) {
        // Didit KYC chỉ dành cho tài khoản Spectator thực sự, không dành cho
        // ứng viên Owner/Jockey đang tạm mang role SPECTATOR trong lúc chờ duyệt.
        String role = user.getRole() == null ? null : user.getRole().getRoleName();
        String accountType = user.getAccountType();
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())
                || role == null || accountType == null
                || !SPECTATOR.equals(role.trim().toUpperCase(Locale.ROOT))
                || !SPECTATOR.equals(accountType.trim().toUpperCase(Locale.ROOT))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account cannot start KYC.");
        }
    }

    private User getUser(String email) {
        // Query user theo email lấy từ JWT.
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
    }

    private boolean isExpired(UserVerification verification) {
        return verification.getExpiresAt() != null && !verification.getExpiresAt().isAfter(LocalDateTime.now());
    }

    private KycSessionResponse sessionResponse(UserVerification v, boolean reused) {
        return KycSessionResponse.builder().verificationId(v.getVerificationId())
                .status(v.getStatus().name()).verificationUrl(v.getVerificationUrl()).reused(reused).build();
    }

    private KycResponseDTO response(UserVerification v) {
        return KycResponseDTO.builder().verificationId(v.getVerificationId()).provider(v.getProvider())
                .status(v.getStatus().name()).verificationUrl(v.getVerificationUrl())
                .attemptNumber(v.getAttemptNumber()).verifiedFullName(v.getVerifiedFullName())
                .verifiedDateOfBirth(v.getVerifiedDateOfBirth()).documentType(v.getDocumentType())
                .documentLastFour(v.getDocumentLastFour()).documentExpiryDate(v.getDocumentExpiryDate())
                .rejectionReason(v.getRejectionReason())
                .submittedAt(v.getSubmittedAt()).verifiedAt(v.getVerifiedAt()).expiresAt(v.getExpiresAt())
                .walletOpen(walletRepository.findByUserId(v.getUserId()).isPresent()).build();
    }

    private static String requiredText(JsonNode node, String name) {
        String value = firstText(node, name);
        if (value == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "Didit response is missing " + name + ".");
        return value;
    }
    private static String firstText(JsonNode node, String... names) {
        if (node == null) return null;
        for (String name : names) {
            JsonNode value = node.get(name);
            if (value != null && !value.isNull() && !value.asText().isBlank()) return value.asText();
        }
        return null;
    }
    private static Long longValue(JsonNode node, String name) {
        JsonNode value = node.get(name); return value != null && value.canConvertToLong() ? value.asLong() : null;
    }
    private static BigDecimal decimalValue(JsonNode node, String name) {
        if (node == null || node.get(name) == null || !node.get(name).isNumber()) return null;
        return node.get(name).decimalValue();
    }
    private static LocalDate dateValue(JsonNode node, String... names) {
        String value = firstText(node, names);
        try { return value == null ? null : LocalDate.parse(value); }
        catch (DateTimeParseException ignored) { return null; }
    }
    private static void requireEqual(String expected, String actual, String message) {
        if (!Objects.equals(expected, actual)) throw new ApiException(HttpStatus.CONFLICT, message);
    }
    private static String truncate(String value, int max) {
        return value == null ? null : value.substring(0, Math.min(max, value.length()));
    }
}
