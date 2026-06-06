package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.List;

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

    @Transactional(readOnly = true)
    @Override
    public JockeyProfileResponse getProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey profile does not exist."));
        return mapProfileToResponse(profile, jockey);
    }

    @Transactional
    @Override
    public JockeyProfileResponse createProfile(JockeyProfileRequest request) {
        User jockey = getCurrentJockey();
        Integer jockeyId = jockey.getUserID();

        if (jockeyProfileRepository.existsById(jockeyId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Jockey profile already exists.");
        }

        if (jockeyProfileRepository.existsByLicenseNo(request.getLicenseNo())) {
            throw new ApiException(HttpStatus.CONFLICT, "License number already exists.");
        }

        JockeyProfile profile = JockeyProfile.builder()
                .jockeyId(jockeyId)
                .licenseNo(request.getLicenseNo())
                .weight(request.getWeight())
                .ranking(request.getRanking())
                .status(request.getStatus() != null ? request.getStatus() : STATUS_ACTIVE)
                .build();

        return mapProfileToResponse(jockeyProfileRepository.save(profile), jockey);
    }

    @Transactional
    @Override
    public JockeyProfileResponse updateProfile(JockeyProfileRequest request) {
        User jockey = getCurrentJockey();
        Integer jockeyId = jockey.getUserID();
        JockeyProfile profile = jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey profile does not exist."));

        if (jockeyProfileRepository.existsByLicenseNoAndJockeyIdNot(request.getLicenseNo(), jockeyId)) {
            throw new ApiException(HttpStatus.CONFLICT, "License number already exists.");
        }

        profile.setLicenseNo(request.getLicenseNo());
        profile.setWeight(request.getWeight());
        profile.setRanking(request.getRanking());
        profile.setStatus(request.getStatus() != null ? request.getStatus() : profile.getStatus());

        return mapProfileToResponse(jockeyProfileRepository.save(profile), jockey);
    }

    @Transactional
    @Override
    public void deleteProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey profile does not exist."));
        jockeyProfileRepository.delete(profile);
    }

    @Transactional(readOnly = true)
    @Override
    public List<JockeyInvitationResponse> getMyInvitations() {
        Integer jockeyId = getCurrentJockey().getUserID();
        return jockeyInvitationRepository.findByJockeyIdOrderByCreatedAtDesc(jockeyId)
                .stream()
                .map(this::mapInvitationToResponse)
                .toList();
    }

    @Transactional
    @Override
    public JockeyInvitationResponse acceptInvitation(Integer invitationId) {
        User jockey = getCurrentJockeyWithActiveProfile();
        JockeyInvitation invitation = getOwnedInvitation(invitationId, jockey.getUserID());
        Registration registration = getPendingRegistration(invitation);

        validateInvitationNotExpired(invitation, registration);

        invitation.setStatus(INVITATION_ACCEPTED);
        invitation.setRespondedAt(LocalDateTime.now());
        registration.setJockeyId(jockey.getUserID());
        registration.setStatus(REGISTRATION_CONFIRMED);

        registrationRepository.save(registration);
        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

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

    private User getCurrentJockeyWithActiveProfile() {
        User jockey = getCurrentJockey();
        JockeyProfile profile = jockeyProfileRepository.findById(jockey.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Jockey profile does not exist."));

        if (!STATUS_ACTIVE.equals(profile.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only active jockey profiles can accept invitations.");
        }

        return jockey;
    }

    private JockeyInvitation getOwnedInvitation(Integer invitationId, Integer jockeyId) {
        return jockeyInvitationRepository.findByInvitationIdAndJockeyId(invitationId, jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation does not exist."));
    }

    private Registration getPendingRegistration(JockeyInvitation invitation) {
        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending invitations can be responded to.");
        }

        return registrationRepository.findById(invitation.getRegistrationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Registration does not exist."));
    }

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

    private JockeyProfileResponse mapProfileToResponse(JockeyProfile profile, User jockey) {
        return JockeyProfileResponse.builder()
                .jockeyId(profile.getJockeyId())
                .fullName(jockey.getFullName())
                .email(jockey.getEmail())
                .licenseNo(profile.getLicenseNo())
                .weight(profile.getWeight())
                .ranking(profile.getRanking())
                .status(profile.getStatus())
                .build();
    }

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
}
