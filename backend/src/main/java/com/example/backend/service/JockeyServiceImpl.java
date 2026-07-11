package com.example.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
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
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.JockeyVerificationFileRepository;
import com.example.backend.repository.JockeyVerificationRepository;
import com.example.backend.repository.RegistrationRepository;
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
    private final TournamentService tournamentService;
    private final JdbcTemplate jdbcTemplate;

    public JockeyServiceImpl(
            JockeyProfileRepository jockeyProfileRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            JockeyVerificationRepository jockeyVerificationRepository,
            JockeyVerificationFileRepository jockeyVerificationFileRepository,
            RegistrationRepository registrationRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            TournamentService tournamentService,
            JdbcTemplate jdbcTemplate) {
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.jockeyVerificationRepository = jockeyVerificationRepository;
        this.jockeyVerificationFileRepository = jockeyVerificationFileRepository;
        this.registrationRepository = registrationRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.tournamentService = tournamentService;
        this.jdbcTemplate = jdbcTemplate;
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
        Integer jockeyId = getCurrentJockey().getUserID();
        return jockeyInvitationRepository.findByJockeyIdOrderByCreatedAtDesc(jockeyId)
                .stream()
                .map(this::mapInvitationToResponse)
                .toList();
    }

    // Lấy chi tiết lời mời mà jockey hiện tại được phép xem.
    @Transactional(readOnly = true)
    @Override
    public JockeyInvitationDetailResponse getMyInvitationDetail(Integer invitationId) {
        User jockey = getCurrentJockey();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());
        Horse horse = horseRepository.findById(invitation.getHorseId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));
        TournamentDetailResponse tournament = tournamentService.getTournamentById(invitation.getTournamentId());

        return JockeyInvitationDetailResponse.builder()
                .invitation(mapInvitationToResponse(invitation))
                .tournament(tournament)
                .horse(mapHorseToResponse(horse))
                .build();
    }

    // Jockey chấp nhận lời mời và tạo registration UNPAID/PENDING.
    @Transactional
    @Override
    public JockeyInvitationResponse acceptInvitation(Integer invitationId) {
        User jockey = getCurrentJockeyWithActiveProfile();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());

        validateInvitationNotExpired(invitation);
        Horse horse = validateOwnerHorseForInvitation(invitation);
        TournamentSnapshot tournament = getTournamentSnapshot(invitation.getTournamentId());
        validateOwnerCanRegisterForTournament(
                invitation.getOwnerId(),
                tournament.tournamentId(),
                invitation.getInvitationId());
        validateHorseActiveRegistrationForTournament(
                horse.getHorseId(),
                tournament.tournamentId(),
                null);
        validateHorseAvailableForOverlappingTournament(
                horse.getHorseId(),
                tournament,
                null,
                invitation.getInvitationId());
        validateJockeyAvailableForTournament(
                tournament,
                jockey.getUserID(),
                null,
                invitation.getInvitationId());

        Registration registration = createPendingRegistration(invitation);
        invitation.setStatus(INVITATION_ACCEPTED);
        invitation.setRegistrationId(registration.getRegistrationId());
        invitation.setRespondedAt(LocalDateTime.now());

        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    // Jockey từ chối lời mời.
    @Transactional
    @Override
    public JockeyInvitationResponse rejectInvitation(Integer invitationId) {
        User jockey = getCurrentJockey();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());

        validateInvitationNotExpired(invitation);

        invitation.setStatus(INVITATION_REJECTED);
        invitation.setRespondedAt(LocalDateTime.now());

        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    // Lấy user jockey từ JWT.
    private User getCurrentJockey() {
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
        return jockeyInvitationRepository.findByInvitationIdAndJockeyId(invitationId, jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lời mời không tồn tại."));
    }

    // Kiểm tra invitation còn PENDING.
    private void validatePendingInvitation(JockeyInvitation invitation) {
        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể phản hồi lời mời đang ở trạng thái PENDING.");
        }
    }

    // Kiểm tra hết hạn.
    private void validateInvitationNotExpired(JockeyInvitation invitation) {
        validatePendingInvitation(invitation);
        if (invitation.getExpiredAt() != null && invitation.getExpiredAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(INVITATION_EXPIRED);
            invitation.setRespondedAt(LocalDateTime.now());
            jockeyInvitationRepository.save(invitation);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lời mời đã hết hạn.");
        }
    }

    // Các hàm validate khác giữ nguyên logic...
    private void validateOwnerCanRegisterForTournament(Integer ownerId, Integer tournamentId, Integer excludedInvitationId) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                tournamentId, ownerId, List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED), null);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Chủ ngựa đã có một đơn đăng ký đang hoạt động trong giải đấu này.");
        }
        if (jockeyInvitationRepository.existsPendingInvitationForTournamentAndOwner(
                tournamentId,
                ownerId,
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Chủ ngựa đã có một lời mời đang chờ xử lý trong giải đấu này.");
        }
    }

    private void validateHorseActiveRegistrationForTournament(Integer horseId, Integer tournamentId, Integer excludedRegistrationId) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                tournamentId, horseId, List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED), excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    private void validateHorseAvailableForOverlappingTournament(
            Integer horseId,
            TournamentSnapshot tournament,
            Integer excludedRegistrationId,
            Integer excludedInvitationId) {
        long overlappingRegistrations = registrationRepository.countByOverlappingTournamentAndHorseIdAndStatusInExcludingRegistration(
                horseId, tournament.startDate(), tournament.endDate(), List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED), excludedRegistrationId);
        if (overlappingRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Ngựa này đã có đơn đăng ký ở giải đấu trùng thời gian.");
        }
        if (jockeyInvitationRepository.existsPendingOverlappingInvitationForHorse(
                horseId,
                tournament.startDate(),
                tournament.endDate(),
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ngựa này đã có lời mời đang chờ xử lý ở giải đấu trùng thời gian.");
        }
    }

    private void validateJockeyAvailableForTournament(TournamentSnapshot tournament, Integer jockeyId, Integer excludedRegistrationId, Integer excludedInvitationId) {
        long sameTournamentRegistrations = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournament.tournamentId(), jockeyId, List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED), excludedRegistrationId);
        if (sameTournamentRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Nài ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
        long overlappingRegistrations = registrationRepository.countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
                        jockeyId, tournament.startDate(), tournament.endDate(), List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED), excludedRegistrationId);
        if (overlappingRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Nài ngựa này đã có đơn đăng ký ở giải đấu trùng thời gian.");
        }
        if (jockeyInvitationRepository.existsPendingOverlappingInvitationForJockey(
                jockeyId,
                tournament.startDate(),
                tournament.endDate(),
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Nài ngựa này đã có lời mời đang chờ xử lý ở giải đấu trùng thời gian.");
        }
    }

    private void validateHorseJockeyPairAvailableForOverlappingTournament(Integer horseId, Integer jockeyId, TournamentSnapshot tournament, Integer excludedRegistrationId, Integer excludedInvitationId) {
        long overlappingRegistrations = registrationRepository.countByOverlappingTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
                        horseId, jockeyId, tournament.startDate(), tournament.endDate(), List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED), excludedRegistrationId);
        if (overlappingRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Cặp ngựa và nài ngựa này đã được đăng ký ở giải đấu trùng thời gian.");
        }
        if (jockeyInvitationRepository.existsPendingOverlappingInvitationForHorseAndJockey(
                horseId,
                jockeyId,
                tournament.startDate(),
                tournament.endDate(),
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Cặp ngựa và nài ngựa này đã có lời mời ở giải đấu trùng thời gian.");
        }
    }

    private Horse validateOwnerHorseForInvitation(JockeyInvitation invitation) {
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

    // Chuyển entity invitation sang DTO.
    private JockeyInvitationResponse mapInvitationToResponse(JockeyInvitation invitation) {
        Registration registration = invitation.getRegistrationId() != null
                ? registrationRepository.findById(invitation.getRegistrationId()).orElse(null)
                : null;
        Integer tournamentId = invitation.getTournamentId() != null ? invitation.getTournamentId() : (registration != null ? registration.getTournamentId() : null);
        Integer horseId = invitation.getHorseId() != null ? invitation.getHorseId() : (registration != null ? registration.getHorseId() : null);
        TournamentSnapshot tournament = tournamentId != null ? getTournamentSnapshotOrNull(tournamentId) : null;
        Horse horse = horseId != null ? horseRepository.findById(horseId).orElse(null) : null;
        User owner = userRepository.findById(invitation.getOwnerId()).orElse(null);
        User jockey = userRepository.findById(invitation.getJockeyId()).orElse(null);

        return JockeyInvitationResponse.builder()
                .invitationId(invitation.getInvitationId())
                .registrationId(invitation.getRegistrationId())
                .tournamentId(tournamentId)
                .tournamentName(tournament != null ? tournament.tournamentName() : null)
                .tournamentStartDate(tournament != null ? tournament.startDate() : null)
                .tournamentEndDate(tournament != null ? tournament.endDate() : null)
                .horseId(horseId)
                .horseName(horse != null ? horse.getHorseName() : null)
                .ownerId(invitation.getOwnerId())
                .ownerName(owner != null ? owner.getUsername() : null)
                .jockeyId(invitation.getJockeyId())
                .jockeyName(jockey != null ? jockey.getUsername() : null)
                .message(invitation.getMessage())
                .createdAt(invitation.getCreatedAt())
                .respondedAt(invitation.getRespondedAt())
                .expiredAt(invitation.getExpiredAt())
                .status(invitation.getStatus())
                .registrationStatus(registration != null ? registration.getStatus() : null)
                .build();
    }

    private TournamentSnapshot getTournamentSnapshot(Integer tournamentId) {
        TournamentSnapshot tournament = getTournamentSnapshotOrNull(tournamentId);
        if (tournament == null) throw new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại.");
        return tournament;
    }

    private TournamentSnapshot getTournamentSnapshotOrNull(Integer tournamentId) {
        try {
            return jdbcTemplate.queryForObject("SELECT tournamentID, tournamentName, startDate, endDate FROM Tournament WHERE tournamentID = ?",
                    (rs, rowNum) -> new TournamentSnapshot(rs.getInt("tournamentID"), rs.getString("tournamentName"), rs.getDate("startDate") != null ? rs.getDate("startDate").toLocalDate() : null, rs.getDate("endDate") != null ? rs.getDate("endDate").toLocalDate() : null), tournamentId);
        } catch (EmptyResultDataAccessException ex) { return null; }
    }

    private record TournamentSnapshot(Integer tournamentId, String tournamentName, LocalDate startDate, LocalDate endDate) {}

    private String normalizeText(String value) { return value == null ? null : value.trim(); }
    private String normalizeUppercase(String value) { String normalizedValue = normalizeText(value); return normalizedValue == null ? null : normalizedValue.toUpperCase(Locale.ROOT); }

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
