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
    private static final String REGISTRATION_ACCEPTED = "ACCEPTED";
    private static final String REGISTRATION_CONFIRMED = "CONFIRMED";
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
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey profile does not exist."));
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
            throw new ApiException(HttpStatus.CONFLICT, "Jockey profile already exists.");
        }

        if (jockeyProfileRepository.existsByLicenseNo(licenseNo)) {
            throw new ApiException(HttpStatus.CONFLICT, "License number already exists.");
        }

        JockeyProfile profile = JockeyProfile.builder()
                .jockeyId(jockeyId)
                .licenseNo(licenseNo)
                .weight(request.getWeight())
                .ranking(normalizeUppercase(request.getRanking()))
                .status(normalizeUppercase(request.getStatus()))
                .imgUrl(normalizeText(request.getImgUrl()))
                .build();

        return mapProfileToResponse(jockeyProfileRepository.save(profile), jockey);
    }

    // Cập nhật hồ sơ jockey và đảm bảo licenseNo không trùng với jockey khác.
    @Transactional
    @Override
    public JockeyProfileResponse updateProfile(JockeyProfileRequest request) {
        User jockey = getCurrentJockey();
        Integer jockeyId = jockey.getUserID();
        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey profile does not exist."));
        String licenseNo = normalizeUppercase(request.getLicenseNo());

        if (jockeyProfileRepository.existsByLicenseNoAndJockeyIdNot(licenseNo, jockeyId)) {
            throw new ApiException(HttpStatus.CONFLICT, "License number already exists.");
        }

        profile.setLicenseNo(licenseNo);
        profile.setWeight(request.getWeight());
        profile.setRanking(normalizeUppercase(request.getRanking()));
        profile.setStatus(normalizeUppercase(request.getStatus()));
        profile.setImgUrl(normalizeText(request.getImgUrl()));

        return mapProfileToResponse(jockeyProfileRepository.save(profile), jockey);
    }

    // Xóa hồ sơ jockey của tài khoản đang đăng nhập.
    @Transactional
    @Override
    public void deleteProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey profile does not exist."));
        jockeyProfileRepository.delete(profile);
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
        Registration registration = getPendingRegistration(invitation);

        validateInvitationNotExpired(invitation, registration);
        validateOwnerHorseForInvitation(invitation, registration);
        validateJockeyAvailableForTournament(
                registration.getTournamentId(),
                jockey.getUserID(),
                registration.getRegistrationId());

        invitation.setStatus(INVITATION_ACCEPTED);
        invitation.setRespondedAt(LocalDateTime.now());
        registration.setJockeyId(jockey.getUserID());
        registration.setStatus(REGISTRATION_ACCEPTED);

        registrationRepository.save(registration);
        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    // Jockey từ chối lời mời và chuyển registration liên quan sang REJECTED.
    @Transactional
    @Override
    public JockeyInvitationResponse rejectInvitation(Integer invitationId) {
        User jockey = getCurrentJockey();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());
        Registration registration = getPendingRegistration(invitation);

        validateInvitationNotExpired(invitation, registration);

        invitation.setStatus(INVITATION_REJECTED);
        invitation.setRespondedAt(LocalDateTime.now());
        registration.setJockeyId(null);
        registration.setStatus(REGISTRATION_REJECTED);

        registrationRepository.save(registration);
        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    // Lấy user jockey từ JWT hiện tại và kiểm tra đúng role JOCKEY.
    private User getCurrentJockey() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "User is not authenticated.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey does not exist."));

        if (user.getRole() == null || !ROLE_JOCKEY.equals(user.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only jockeys can access this resource.");
        }

        return user;
    }

    // Lấy jockey hiện tại và bắt buộc profile của jockey phải tồn tại, đang ACTIVE.
    private User getCurrentJockeyWithActiveProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Jockey profile does not exist."));

        if (!STATUS_ACTIVE.equals(profile.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only active jockey profiles can accept invitations.");
        }

        return jockey;
    }

    // Lấy lời mời theo invitationId và đảm bảo lời mời thuộc jockey hiện tại.
    private JockeyInvitation getOwnedInvitation(Integer invitationId, Integer jockeyId) {
        return jockeyInvitationRepository.findByInvitationIdAndJockeyId(invitationId, jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation does not exist."));
    }

    // Kiểm tra invitation còn PENDING và lấy registration tương ứng.
    private Registration getPendingRegistration(JockeyInvitation invitation) {
        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending invitations can be responded to.");
        }

        return registrationRepository.findById(invitation.getRegistrationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Registration does not exist."));
    }

    // Nếu lời mời hết hạn thì chuyển invitation và registration sang EXPIRED rồi báo lỗi.
    private void validateInvitationNotExpired(JockeyInvitation invitation, Registration registration) {
        if (invitation.getExpiredAt() != null && invitation.getExpiredAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(INVITATION_EXPIRED);
            invitation.setRespondedAt(LocalDateTime.now());
            registration.setStatus(REGISTRATION_EXPIRED);
            jockeyInvitationRepository.save(invitation);
            registrationRepository.save(registration);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invitation has expired.");
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
                    "This jockey already has an active registration for the tournament.");
        }
    }

    // Kiểm tra ngựa của registration thật sự thuộc owner đã gửi invitation và ngựa đang ACTIVE.
    private void validateOwnerHorseForInvitation(JockeyInvitation invitation, Registration registration) {
        if (!Objects.equals(invitation.getOwnerId(), registration.getOwnerId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Invitation owner does not match the registration owner.");
        }

        Horse horse = horseRepository.findById(registration.getHorseId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Horse does not exist."));

        if (!Objects.equals(horse.getOwnerId(), invitation.getOwnerId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse does not belong to the invitation owner.");
        }

        if (!STATUS_ACTIVE.equals(horse.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Horse is not active.");
        }
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
                .imgUrl(profile.getImgUrl())
                .build();
    }

    // Chuyển entity invitation sang DTO, kèm thông tin tournament, horse, owner và jockey.
    private JockeyInvitationResponse mapInvitationToResponse(JockeyInvitation invitation) {
        Registration registration = registrationRepository.findById(invitation.getRegistrationId()).orElse(null);
        TournamentSnapshot tournament = registration != null
                ? getTournamentSnapshotOrNull(registration.getTournamentId())
                : null;
        Horse horse = registration != null
                ? horseRepository.findById(registration.getHorseId()).orElse(null)
                : null;
        User owner = userRepository.findById(invitation.getOwnerId()).orElse(null);
        User jockey = userRepository.findById(invitation.getJockeyId()).orElse(null);

        return JockeyInvitationResponse.builder()
                .invitationId(invitation.getInvitationId())
                .registrationId(invitation.getRegistrationId())
                .tournamentId(registration != null ? registration.getTournamentId() : null)
                .tournamentName(tournament != null ? tournament.tournamentName() : null)
                .horseId(registration != null ? registration.getHorseId() : null)
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
}
