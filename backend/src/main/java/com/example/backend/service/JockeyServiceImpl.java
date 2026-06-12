package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.request.JockeyProfileRequest;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;

@Service
public class JockeyServiceImpl implements JockeyService {
    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_UNDER_REVIEW = "UNDER_REVIEW";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String REGISTRATION_ACCEPTED = "ACCEPTED";
    private static final String REGISTRATION_CONFIRMED = "CONFIRMED";
    private static final String REGISTRATION_CANCELLED = "CANCELLED";
    private static final String REGISTRATION_REJECTED = "REJECTED";
    private static final String REGISTRATION_EXPIRED = "EXPIRED";
    private static final String INVITATION_PENDING = "PENDING";
    private static final String INVITATION_ACCEPTED = "ACCEPTED";
    private static final String INVITATION_REJECTED = "REJECTED";
    private static final String INVITATION_EXPIRED = "EXPIRED";

    private final JockeyProfileRepository jockeyProfileRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;
    private final RegistrationRepository registrationRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public JockeyServiceImpl(
            JockeyProfileRepository jockeyProfileRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            RegistrationRepository registrationRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            JdbcTemplate jdbcTemplate) {
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.registrationRepository = registrationRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
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

    // Tạo hồ sơ jockey mới sau khi kiểm tra profile và license không trùng.
    @Transactional
    @Override
    public JockeyProfileResponse createProfile(JockeyProfileRequest request) {
        User jockey = getCurrentJockey();
        Integer jockeyId = jockey.getUserID();
        String licenseNo = normalizeUppercase(request.getLicenseNo());

        if (jockeyProfileRepository.existsById(jockeyId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Hồ sơ nài ngựa đã tồn tại.");
        }

        if (jockeyProfileRepository.existsByLicenseNo(licenseNo)) {
            throw new ApiException(HttpStatus.CONFLICT, "Số giấy phép đã tồn tại.");
        }

        JockeyProfile profile = JockeyProfile.builder()
                .jockeyId(jockeyId)
                .licenseNo(licenseNo)
                .weight(request.getWeight())
                .ranking(normalizeUppercase(request.getRanking()))
                .status(STATUS_UNDER_REVIEW)
                .rejectionReason(null)
                .imgUrl(normalizeText(request.getImgUrl()))
                .build();

        JockeyProfile savedProfile = jockeyProfileRepository.save(profile);
        markProfileUnderReview(jockey);
        return mapProfileToResponse(savedProfile, jockey);
    }

    // Cập nhật hồ sơ jockey và đảm bảo licenseNo không trùng với jockey khác.
    @Transactional
    @Override
    public JockeyProfileResponse updateProfile(JockeyProfileRequest request) {
        User jockey = getCurrentJockey();
        Integer jockeyId = jockey.getUserID();
        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hồ sơ nài ngựa không tồn tại."));
        String licenseNo = normalizeUppercase(request.getLicenseNo());

        if (jockeyProfileRepository.existsByLicenseNoAndJockeyIdNot(licenseNo, jockeyId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Số giấy phép đã tồn tại.");
        }

        profile.setLicenseNo(licenseNo);
        profile.setWeight(request.getWeight());
        profile.setRanking(normalizeUppercase(request.getRanking()));
        profile.setStatus(STATUS_UNDER_REVIEW);
        profile.setRejectionReason(null);
        profile.setImgUrl(normalizeText(request.getImgUrl()));

        JockeyProfile savedProfile = jockeyProfileRepository.save(profile);
        markProfileUnderReview(jockey);
        return mapProfileToResponse(savedProfile, jockey);
    }

    // Chuyển hồ sơ jockey sang INACTIVE thay vì xóa dữ liệu khỏi hệ thống.
    @Transactional
    @Override
    public JockeyProfileResponse deactivateProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Hồ sơ nài ngựa không tồn tại."));
        profile.setStatus(STATUS_INACTIVE);
        JockeyProfile savedProfile = jockeyProfileRepository.save(profile);
        return mapProfileToResponse(savedProfile, jockey);
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

    // Jockey chấp nhận lời mời, gắn jockey vào registration và chuyển registration sang ACCEPTED.
    @Transactional
    @Override
    public JockeyInvitationResponse acceptInvitation(Integer invitationId) {
        User jockey = getCurrentJockeyWithActiveProfile();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());

        validateInvitationNotExpired(invitation);
        Horse horse = validateOwnerHorseForInvitation(invitation);
        validateJockeyAvailableForTournament(
                invitation.getTournamentId(),
                jockey.getUserID(),
                null);

        Registration registration = registrationRepository.findByTournamentIdAndHorseId(
                        invitation.getTournamentId(), invitation.getHorseId())
                .orElseGet(Registration::new);

        if (registration.getRegistrationId() != null
                && !List.of(REGISTRATION_CANCELLED, REGISTRATION_REJECTED).contains(registration.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }

        invitation.setStatus(INVITATION_ACCEPTED);
        invitation.setRespondedAt(LocalDateTime.now());
        registration.setTournamentId(invitation.getTournamentId());
        registration.setHorseId(horse.getHorseId());
        registration.setOwnerId(invitation.getOwnerId());
        registration.setJockeyId(jockey.getUserID());
        registration.setStatus(REGISTRATION_ACCEPTED);

        registration = registrationRepository.save(registration);
        invitation.setRegistrationId(registration.getRegistrationId());
        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    // Jockey từ chối lời mời và chuyển registration liên quan sang REJECTED.
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

    // Lấy user jockey từ JWT hiện tại và kiểm tra đúng role JOCKEY.
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

    // Lấy jockey hiện tại và bắt buộc profile của jockey phải tồn tại, đang ACTIVE.
    private User getCurrentJockeyWithActiveProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Hồ sơ nài ngựa không tồn tại."));

        if (!STATUS_ACTIVE.equals(profile.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ hồ sơ nài ngựa đang hoạt động mới có thể chấp nhận lời mời.");
        }

        if (!STATUS_ACTIVE.equals(jockey.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ tài khoản nài ngựa đang hoạt động mới có thể chấp nhận lời mời.");
        }

        return jockey;
    }

    // Lấy lời mời theo invitationId và đảm bảo lời mời thuộc jockey hiện tại.
    private JockeyInvitation getOwnedInvitation(Integer invitationId, Integer jockeyId) {
        return jockeyInvitationRepository.findByInvitationIdAndJockeyId(invitationId, jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Lời mời không tồn tại."));
    }

    // Kiểm tra invitation còn PENDING trước khi jockey phản hồi.
    private void validatePendingInvitation(JockeyInvitation invitation) {
        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Chỉ có thể phản hồi lời mời đang ở trạng thái PENDING.");
        }
    }

    // Nếu lời mời hết hạn thì chuyển invitation sang EXPIRED rồi báo lỗi.
    private void validateInvitationNotExpired(JockeyInvitation invitation) {
        validatePendingInvitation(invitation);
        if (invitation.getExpiredAt() != null && invitation.getExpiredAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(INVITATION_EXPIRED);
            invitation.setRespondedAt(LocalDateTime.now());
            jockeyInvitationRepository.save(invitation);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lời mời đã hết hạn.");
        }
    }

    // Kiểm tra jockey chưa có registration ACCEPTED hoặc CONFIRMED trong cùng tournament.
    private void validateJockeyAvailableForTournament(
            Integer tournamentId,
            Integer jockeyId,
            Integer excludedRegistrationId) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournamentId,
                jockeyId,
                List.of(REGISTRATION_ACCEPTED, REGISTRATION_CONFIRMED),
                excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    // Kiểm tra ngựa của invitation thật sự thuộc owner đã gửi invitation và ngựa đang ACTIVE.
    private Horse validateOwnerHorseForInvitation(JockeyInvitation invitation) {
        Horse horse = horseRepository.findById(invitation.getHorseId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ngựa không tồn tại."));

        if (!Objects.equals(horse.getOwnerId(), invitation.getOwnerId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa không thuộc sở hữu của người gửi lời mời.");
        }

        if (!STATUS_ACTIVE.equals(horse.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Ngựa không ở trạng thái ACTIVE.");
        }

        return horse;
    }

    // Chuyển entity JockeyProfile sang DTO trả về cho client.
    private JockeyProfileResponse mapProfileToResponse(JockeyProfile profile, User jockey) {
        return JockeyProfileResponse.builder()
                .jockeyId(profile.getJockeyId())
                .fullName(jockey.getFullName())
                .email(jockey.getEmail())
                .licenseNo(profile.getLicenseNo())
                .weight(profile.getWeight())
                .ranking(profile.getRanking())
                .status(profile.getStatus())
                .rejectionReason(profile.getRejectionReason())
                .imgUrl(profile.getImgUrl())
                .build();
    }

    // Chuyển entity invitation sang DTO, kèm thông tin tournament, horse, owner và jockey.
    private JockeyInvitationResponse mapInvitationToResponse(JockeyInvitation invitation) {
        Registration registration = invitation.getRegistrationId() != null
                ? registrationRepository.findById(invitation.getRegistrationId()).orElse(null)
                : null;
        Integer tournamentId = invitation.getTournamentId() != null
                ? invitation.getTournamentId()
                : registration != null ? registration.getTournamentId() : null;
        Integer horseId = invitation.getHorseId() != null
                ? invitation.getHorseId()
                : registration != null ? registration.getHorseId() : null;
        TournamentSnapshot tournament = tournamentId != null
                ? getTournamentSnapshotOrNull(tournamentId)
                : null;
        Horse horse = horseId != null
                ? horseRepository.findById(horseId).orElse(null)
                : null;
        User owner = userRepository.findById(invitation.getOwnerId()).orElse(null);
        User jockey = userRepository.findById(invitation.getJockeyId()).orElse(null);

        return JockeyInvitationResponse.builder()
                .invitationId(invitation.getInvitationId())
                .registrationId(invitation.getRegistrationId())
                .tournamentId(tournamentId)
                .tournamentName(tournament != null ? tournament.tournamentName() : null)
                .horseId(horseId)
                .horseName(horse != null ? horse.getHorseName() : null)
                .ownerId(invitation.getOwnerId())
                .ownerName(owner != null ? owner.getFullName() : null)
                .jockeyId(invitation.getJockeyId())
                .jockeyName(jockey != null ? jockey.getFullName() : null)
                .message(invitation.getMessage())
                .createdAt(invitation.getCreatedAt())
                .respondedAt(invitation.getRespondedAt())
                .expiredAt(invitation.getExpiredAt())
                .status(invitation.getStatus())
                .registrationStatus(registration != null ? registration.getStatus() : null)
                .build();
    }

    // Lấy thông tin rút gọn của tournament bằng query trực tiếp; trả null nếu không tìm thấy.
    private TournamentSnapshot getTournamentSnapshotOrNull(Integer tournamentId) {
        try {
            return jdbcTemplate.queryForObject("""
                    SELECT tournamentID, tournamentName
                    FROM Tournament
                    WHERE tournamentID = ?
                    """,
                    (rs, rowNum) -> new TournamentSnapshot(
                            rs.getInt("tournamentID"),
                            rs.getString("tournamentName")),
                    tournamentId);
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    private record TournamentSnapshot(Integer tournamentId, String tournamentName) {
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeUppercase(String value) {
        String normalizedValue = normalizeText(value);
        return normalizedValue == null ? null : normalizedValue.toUpperCase(Locale.ROOT);
    }

    private void markProfileUnderReview(User jockey) {
        jockey.setStatus(STATUS_UNDER_REVIEW);
        userRepository.save(jockey);
    }
}
