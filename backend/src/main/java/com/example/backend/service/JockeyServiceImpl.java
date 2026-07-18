package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.JockeyProfileRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.dto.response.JockeyInvitationDetailResponse;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.JockeyVerificationFileResponse;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.dto.response.TournamentDetailResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.JockeyVerification;
import com.example.backend.entity.JockeyVerificationFile;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.JockeyVerificationFileRepository;
import com.example.backend.repository.JockeyVerificationRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;

@Service
public class JockeyServiceImpl implements JockeyService {
    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";
    private static final String INVITATION_PENDING = "PENDING";
    private static final String INVITATION_ACCEPTED = "ACCEPTED";
    private static final String INVITATION_REJECTED = "REJECTED";
    private static final String INVITATION_EXPIRED = "EXPIRED";

    private final JockeyProfileRepository jockeyProfileRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;
    private final JockeyVerificationRepository jockeyVerificationRepository;
    private final JockeyVerificationFileRepository jockeyVerificationFileRepository;
    private final RegistrationRepository registrationRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentService tournamentService;
    private final RegistrationAvailabilityService availabilityService;
    private final RegistrationEligibilityService eligibilityService;
    private final JockeyInvitationService jockeyInvitationService;

    public JockeyServiceImpl(
            JockeyProfileRepository jockeyProfileRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            JockeyVerificationRepository jockeyVerificationRepository,
            JockeyVerificationFileRepository jockeyVerificationFileRepository,
            RegistrationRepository registrationRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            TournamentRepository tournamentRepository,
            TournamentService tournamentService,
            RegistrationAvailabilityService availabilityService,
            RegistrationEligibilityService eligibilityService,
            JockeyInvitationService jockeyInvitationService) {
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.jockeyVerificationRepository = jockeyVerificationRepository;
        this.jockeyVerificationFileRepository = jockeyVerificationFileRepository;
        this.registrationRepository = registrationRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.tournamentRepository = tournamentRepository;
        this.tournamentService = tournamentService;
        this.availabilityService = availabilityService;
        this.eligibilityService = eligibilityService;
        this.jockeyInvitationService = jockeyInvitationService;
    }

    // Lấy hồ sơ jockey của tài khoản đang đăng nhập.
    @Transactional(readOnly = true)
    @Override
    public JockeyProfileResponse getProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hồ sơ nài ngựa không tồn tại."));
        return mapProfileToResponse(profile, jockey);
    }

    @Transactional(readOnly = true)
    @Override
    public JockeyProfileResponse getAdminProfile(Integer jockeyId) {
        // FLOW: Admin Registration Entity Detail Popup
        // ORDER: 5JOCKEY/6 - Service validates JOCKEY identity/profile existence and maps profile evidence for display.
        // Validation: clicked user must exist, have JOCKEY role, and own a JockeyProfile.
        // DB effect: read-only User + JockeyProfile lookup mapped to JockeyProfileResponse.
        User jockey = userRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nài ngựa không tồn tại."));

        if (jockey.getRole() == null || !ROLE_JOCKEY.equals(jockey.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User is not a jockey.");
        }

        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hồ sơ nài ngựa không tồn tại."));

        return mapProfileToResponse(profile, jockey);
    }

    // Tạo hồ sơ jockey mới.
    @Transactional
    @Override
    public JockeyProfileResponse createProfile(JockeyProfileRequest request) {
        User jockey = getCurrentJockey();
        Integer jockeyId = jockey.getUserID();

        if (jockeyProfileRepository.existsById(jockeyId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Hồ sơ nài ngựa đã tồn tại.");
        }

        JockeyProfile profile = JockeyProfile.builder()
                .jockeyId(jockeyId)
                .fullName(normalizeText(request.getFullName()) != null ? normalizeText(request.getFullName()) : jockey.getUsername())
                .weight(request.getWeight())
                .biography(normalizeText(request.getBiography()))
                .totalRaces(request.getTotalRaces() != null ? request.getTotalRaces() : 0)
                .totalWins(request.getTotalWins() != null ? request.getTotalWins() : 0)
                .build();

        updatePhoneNumber(jockey, request.getPhoneNumber());
        JockeyProfile savedProfile = jockeyProfileRepository.save(profile);
        return mapProfileToResponse(savedProfile, jockey);
    }

    // Cập nhật hồ sơ jockey.
    @Transactional
    @Override
    public JockeyProfileResponse updateProfile(JockeyProfileRequest request) {
        User jockey = getCurrentJockey();
        Integer jockeyId = jockey.getUserID();
        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hồ sơ nài ngựa không tồn tại."));

        updatePhoneNumber(jockey, request.getPhoneNumber());
        if (normalizeText(request.getFullName()) != null) {
            profile.setFullName(normalizeText(request.getFullName()));
        }
        return mapProfileToResponse(profile, jockey);
    }

    // Chuyển tài khoản user sang INACTIVE.
    @Transactional
    @Override
    public JockeyProfileResponse deactivateProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hồ sơ nài ngựa không tồn tại."));
        
        jockey.setStatus(STATUS_INACTIVE);
        userRepository.save(jockey);
        
        return mapProfileToResponse(profile, jockey);
    }

    // Lấy danh sách lời mời được gửi cho jockey hiện tại, mới nhất lên trước.
    @Transactional(readOnly = true)
    @Override
    public List<JockeyInvitationResponse> getMyInvitations() {
        // Lấy jockey hiện tại rồi query DB danh sách lời mời gửi cho jockey đó.
        Integer jockeyId = getCurrentJockey().getUserID();
        return jockeyInvitationRepository.findByJockeyIdOrderByCreatedAtDesc(jockeyId)
                .stream()
                .map(jockeyInvitationService::toResponse)
                .toList();
    }

    // Lấy chi tiết lời mời mà jockey hiện tại được phép xem.
    @Transactional(readOnly = true)
    @Override
    public JockeyInvitationDetailResponse getMyInvitationDetail(Integer invitationId) {
        // Chỉ cho jockey xem chi tiết lời mời thuộc về chính mình.
        User jockey = getCurrentJockey();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());
        // Lấy thêm ngựa và tournament để hiển thị đủ thông tin lời mời.
        Horse horse = horseRepository.findById(invitation.getHorseId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));
        TournamentDetailResponse tournament = tournamentService.getTournamentById(invitation.getTournamentId());

        return JockeyInvitationDetailResponse.builder()
                .invitation(jockeyInvitationService.toResponse(invitation))
                .tournament(tournament)
                .horse(mapHorseToResponse(horse))
                .build();
    }

    // Jockey chấp nhận lời mời và tạo registration UNPAID/PENDING.
    @Transactional
    @Override
    public JockeyInvitationResponse acceptInvitation(Integer invitationId) {
        // Jockey phải có profile hợp lệ và lời mời phải thuộc về jockey đang đăng nhập.
        User jockey = getCurrentJockeyWithActiveProfile();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());

        // Validate lời mời còn PENDING/chưa hết hạn và ngựa thuộc đúng owner.
        validateInvitationNotExpired(invitation);
        Horse horse = validateOwnerHorseForInvitation(invitation);
        Tournament tournament = getTournament(invitation.getTournamentId());
        // Kiểm tra điều kiện giải đấu và tránh tạo registration trùng/không hợp lệ.
        eligibilityService.validateNewSubmission(
                tournament,
                horse.getHorseId(),
                invitation.getOwnerId(),
                jockey.getUserID()
        );
        availabilityService.validateAcceptedInvitationCanCreateRegistration(
                invitation.getOwnerId(),
                horse.getHorseId(),
                jockey.getUserID(),
                tournament,
                invitation.getInvitationId());

        // Khi chấp nhận, tạo registration chờ owner thanh toán và cập nhật invitation.
        Registration registration = createPendingRegistration(invitation);
        invitation.setStatus(INVITATION_ACCEPTED);
        invitation.setRegistrationId(registration.getRegistrationId());
        invitation.setRespondedAt(LocalDateTime.now());

        return jockeyInvitationService.toResponse(jockeyInvitationRepository.save(invitation));
    }

    // Jockey từ chối lời mời.
    @Transactional
    @Override
    public JockeyInvitationResponse rejectInvitation(Integer invitationId) {
        // Chỉ jockey nhận lời mời mới được từ chối lời mời đó.
        User jockey = getCurrentJockey();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());

        // Chỉ lời mời còn PENDING/chưa hết hạn mới được phản hồi.
        validateInvitationNotExpired(invitation);

        // Cập nhật trạng thái từ chối và thời điểm phản hồi.
        invitation.setStatus(INVITATION_REJECTED);
        invitation.setRespondedAt(LocalDateTime.now());

        return jockeyInvitationService.toResponse(jockeyInvitationRepository.save(invitation));
    }

    // Lấy user jockey từ JWT.
    private User getCurrentJockey() {
        // Lấy user từ JWT và validate role phải là JOCKEY.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Người dùng chưa được xác thực.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Nài ngựa không tồn tại."));

        if (user.getRole() == null || !ROLE_JOCKEY.equals(user.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Chỉ nài ngựa mới có thể truy cập tài nguyên này.");
        }

        return user;
    }

    // Kiểm tra tài khoản nài ngựa đang hoạt động.
    private User getCurrentJockeyWithActiveProfile() {
        // Ngoài role JOCKEY, tài khoản phải có profile và đang ACTIVE mới được accept invitation.
        User jockey = getCurrentJockey();
        if (!jockeyProfileRepository.existsById(jockey.getUserID())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Hồ sơ nài ngựa không tồn tại.");
        }

        if (!STATUS_ACTIVE.equals(jockey.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ tài khoản nài ngựa đang hoạt động mới có thể chấp nhận lời mời.");
        }

        return jockey;
    }

    // Lấy lời mời.
    private JockeyInvitation getOwnedInvitation(Integer invitationId, Integer jockeyId) {
        // Query theo cả invitationId và jockeyId để tránh truy cập lời mời của jockey khác.
        return jockeyInvitationRepository.findByInvitationIdAndJockeyId(invitationId, jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lời mời không tồn tại."));
    }

    // Kiểm tra invitation còn PENDING.
    private void validatePendingInvitation(JockeyInvitation invitation) {
        // Jockey chỉ được phản hồi lời mời đang ở trạng thái PENDING.
        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể phản hồi lời mời đang ở trạng thái PENDING.");
        }
    }

    // Kiểm tra hết hạn.
    private void validateInvitationNotExpired(JockeyInvitation invitation) {
        // Kiểm tra lời mời còn PENDING trước khi xét hết hạn.
        validatePendingInvitation(invitation);
        if (invitation.getExpiredAt() != null && invitation.getExpiredAt().isBefore(LocalDateTime.now())) {
            // Nếu đã hết hạn, cập nhật DB sang EXPIRED rồi chặn thao tác.
            invitation.setStatus(INVITATION_EXPIRED);
            invitation.setRespondedAt(LocalDateTime.now());
            jockeyInvitationRepository.save(invitation);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lời mời đã hết hạn.");
        }
    }

    private Horse validateOwnerHorseForInvitation(JockeyInvitation invitation) {
        // Lấy ngựa trong DB và đảm bảo ngựa đúng là của owner gửi lời mời.
        Horse horse = horseRepository.findById(invitation.getHorseId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));
        if (!Objects.equals(horse.getOwnerId(), invitation.getOwnerId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Ngựa không thuộc sở hữu của người gửi lời mời.");
        }
        if (!STATUS_ACTIVE.equals(horse.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Ngựa không ở trạng thái ACTIVE.");
        }
        return horse;
    }

    private Registration createPendingRegistration(JockeyInvitation invitation) {
        // Tạo registration nháp sau khi jockey accept, owner sẽ thanh toán sau.
        Registration registration = new Registration();
        registration.setTournamentId(invitation.getTournamentId());
        registration.setHorseId(invitation.getHorseId());
        registration.setOwnerId(invitation.getOwnerId());
        registration.setJockeyId(invitation.getJockeyId());
        registration.setRegistrationNo(generateRegistrationNo(invitation.getTournamentId()));
        registration.setPaymentStatus(PaymentStatus.UNPAID);
        registration.setApprovalStatus(RegistrationStatus.PENDING);
        registration.setSubmittedAt(LocalDateTime.now());
        return registrationRepository.save(registration);
    }

    private String generateRegistrationNo(Integer tournamentId) {
        return "REG-T" + tournamentId + "-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();
    }

    private HorseResponse mapHorseToResponse(Horse horse) {
        List<Integer> registrationIds = registrationRepository.findRegistrationIdsByHorseId(horse.getHorseId());
        return HorseResponse.builder()
                .horseId(horse.getHorseId())
                .ownerId(horse.getOwnerId())
                .horseName(horse.getHorseName())
                .age(horse.getAge())
                .dayOfBirth(horse.getDayOfBirth())
                .weight(horse.getWeight())
                .colour(horse.getColour())
                .sex(horse.getSex())
                .breeding(horse.getBreeding())
                .trainer(horse.getTrainer())
                .healthCertExpiry(horse.getHealthCertExpiry())
                .healthCertificateUrl(horse.getHealthCertificateUrl())
                .officialHorseProfileUrl(horse.getOfficialHorseProfileUrl())
                .status(horse.getStatus())
                .rejectionReason(horse.getRejectionReason())
                .createdAt(horse.getCreatedAt())
                .updatedAt(horse.getUpdatedAt())
                .registrationCount(registrationIds.size())
                .participated(hasActiveRegistration(registrationIds))
                .build();
    }

    private boolean hasActiveRegistration(List<Integer> registrationIds) {
        return !registrationIds.isEmpty()
                && registrationRepository.countByRegistrationIdInAndStatusIn(
                        registrationIds,
                        List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED)) > 0;
    }

    // Chuyển entity JockeyProfile sang DTO.
    private JockeyProfileResponse mapProfileToResponse(JockeyProfile profile, User jockey) {
        JockeyVerification verification = jockeyVerificationRepository
                .findFirstByJockeyIdOrderByCreatedAtDesc(profile.getJockeyId())
                .orElse(null);
        List<JockeyVerificationFileResponse> files = verification == null
                ? List.of()
                : jockeyVerificationFileRepository.findByVerificationId(verification.getVerificationId())
                        .stream()
                        .map(this::mapVerificationFileToResponse)
                        .toList();

        return JockeyProfileResponse.builder()
                .jockeyId(profile.getJockeyId())
                .fullName(profile.getFullName() != null ? profile.getFullName() : jockey.getUsername())
                .email(jockey.getEmail())
                .phoneNumber(jockey.getPhone())
                .weight(profile.getWeight())
                .biography(profile.getBiography())
                .totalRaces(profile.getTotalRaces())
                .totalWins(profile.getTotalWins())
                .trainerName(verification != null ? verification.getTrainerName() : null)
                .trainerEmail(verification != null ? verification.getTrainerEmail() : null)
                .academyStableAddress(verification != null ? verification.getAcademyStableAddress() : null)
                .issuingAuthority(verification != null ? verification.getIssuingAuthority() : null)
                .verificationLink(verification != null ? verification.getVerificationLink() : null)
                .licenceType(verification != null ? verification.getLicenceType() : null)
                .expiryDate(verification != null ? verification.getExpiryDate() : null)
                .verificationStatus(verification != null ? verification.getVerificationStatus() : null)
                .rejectionReason(verification != null ? verification.getRejectionReason() : null)
                .resubmitCount(verification != null ? verification.getResubmitCount() : null)
                .submittedAt(verification != null ? verification.getSubmittedAt() : null)
                .reviewedAt(verification != null ? verification.getReviewedAt() : null)
                .reviewedBy(verification != null ? verification.getReviewedBy() : null)
                .files(files)
                .build();
    }

    private JockeyVerificationFileResponse mapVerificationFileToResponse(JockeyVerificationFile file) {
        return JockeyVerificationFileResponse.builder()
                .fileId(file.getFileId())
                .fileUrl(file.getFileUrl())
                .fileType(file.getFileType())
                .uploadedAt(file.getUploadedAt())
                .build();
    }

    private Tournament getTournament(Integer tournamentId) {
        return tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại."));
    }

    private String normalizeText(String value) { return value == null ? null : value.trim(); }

    private void updatePhoneNumber(User jockey, String phoneNumber) {
        String normalizedPhone = normalizeText(phoneNumber);
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phone number is required.");
        }
        if (!Objects.equals(jockey.getPhone(), normalizedPhone)) {
            jockey.setPhone(normalizedPhone);
            userRepository.save(jockey);
        }
    }

}
