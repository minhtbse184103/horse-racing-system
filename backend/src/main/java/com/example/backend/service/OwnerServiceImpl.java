package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.InviteJockeyRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.OwnerDashboardResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;

@Service
public class OwnerServiceImpl implements OwnerService {
    private static final String ROLE_OWNER = "OWNER";
    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String REGISTRATION_PENDING_JOCKEY = "PENDING_JOCKEY";
    private static final String REGISTRATION_CONFIRMED = "CONFIRMED";
    private static final String REGISTRATION_CANCELLED = "CANCELLED";
    private static final String REGISTRATION_REJECTED = "REJECTED";
    private static final String INVITATION_PENDING = "PENDING";
    private static final String INVITATION_CANCELLED = "CANCELLED";

    private final HorseRepository horseRepository;
    private final RegistrationRepository registrationRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;
    private final JockeyProfileRepository jockeyProfileRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public OwnerServiceImpl(
            HorseRepository horseRepository,
            RegistrationRepository registrationRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            JockeyProfileRepository jockeyProfileRepository,
            UserRepository userRepository,
            JdbcTemplate jdbcTemplate) {
        this.horseRepository = horseRepository;
        this.registrationRepository = registrationRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    @Override
    public OwnerDashboardResponse getDashboard() {
        User owner = getCurrentOwner();
        Integer ownerId = owner.getUserID();
        List<Horse> horses = horseRepository.findByOwnerId(ownerId);

        long participatedHorses = horses.stream()
                .filter(horse -> hasActiveRegistration(horse.getHorseId()))
                .count();

        return OwnerDashboardResponse.builder()
                .ownerId(ownerId)
                .ownerName(owner.getFullName())
                .totalHorses(horseRepository.countByOwnerId(ownerId))
                .totalRegistrations(registrationRepository.countByOwnerId(ownerId))
                .registeredHorses(registrationRepository.countRegisteredHorsesByOwnerId(ownerId))
                .participatedHorses(participatedHorses)
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public List<HorseResponse> getMyHorses() {
        Integer ownerId = getCurrentOwner().getUserID();
        return horseRepository.findByOwnerId(ownerId)
                .stream()
                .map(this::mapHorseToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public HorseResponse getMyHorseById(Integer horseId) {
        return mapHorseToResponse(getOwnedHorse(horseId));
    }

    @Transactional
    @Override
    public HorseResponse createHorse(CreateHorseRequest request) {
        Integer ownerId = getCurrentOwner().getUserID();
        Horse horse = Horse.builder()
                .ownerId(ownerId)
                .horseName(request.getHorseName())
                .breed(request.getBreed())
                .gender(request.getGender())
                .color(request.getColor())
                .dayOfBirth(request.getDayOfBirth())
                .weight(request.getWeight())
                .healthCertExpiry(request.getHealthCertExpiry())
                .status(request.getStatus() != null ? request.getStatus() : STATUS_ACTIVE)
                .build();

        return mapHorseToResponse(horseRepository.save(horse));
    }

    @Transactional
    @Override
    public HorseResponse updateHorse(Integer horseId, UpdateHorseRequest request) {
        Horse horse = getOwnedHorse(horseId);
        horse.setHorseName(request.getHorseName());
        horse.setBreed(request.getBreed());
        horse.setGender(request.getGender());
        horse.setColor(request.getColor());
        horse.setDayOfBirth(request.getDayOfBirth());
        horse.setWeight(request.getWeight());
        horse.setHealthCertExpiry(request.getHealthCertExpiry());
        horse.setStatus(request.getStatus());

        return mapHorseToResponse(horseRepository.save(horse));
    }

    @Transactional
    @Override
    public void deleteHorse(Integer horseId) {
        Horse horse = getOwnedHorse(horseId);
        List<Integer> registrationIds = registrationRepository.findRegistrationIdsByHorseId(horse.getHorseId());

        if (!registrationIds.isEmpty()
                && registrationRepository.countByRegistrationIdInAndStatusIn(
                registrationIds,
                List.of(REGISTRATION_PENDING_JOCKEY, REGISTRATION_CONFIRMED)) > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse has active tournament registrations and cannot be deleted.");
        }

        if (!registrationIds.isEmpty()) {
            jockeyInvitationRepository.deleteByRegistrationIdIn(registrationIds);
            registrationRepository.deleteByHorseId(horse.getHorseId());
        }

        horseRepository.delete(horse);
    }

    @Transactional(readOnly = true)
    @Override
    public List<JockeyInvitationResponse> getMyInvitations() {
        Integer ownerId = getCurrentOwner().getUserID();
        return jockeyInvitationRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(this::mapInvitationToResponse)
                .toList();
    }

    @Transactional
    @Override
    public JockeyInvitationResponse inviteJockey(InviteJockeyRequest request) {
        User owner = getCurrentOwner();
        Horse horse = getOwnedHorse(request.getHorseId());
        TournamentSnapshot tournament = getTournamentSnapshot(request.getTournamentId());
        User jockey = getJockey(request.getJockeyId());

        validateHorseCanRegister(horse, tournament);

        Registration registration = registrationRepository.findByTournamentIdAndHorseId(
                        request.getTournamentId(), request.getHorseId())
                .orElseGet(Registration::new);

        if (registration.getRegistrationId() != null
                && !List.of(REGISTRATION_CANCELLED, REGISTRATION_REJECTED).contains(registration.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This horse already has an active registration for the tournament.");
        }

        registration.setTournamentId(tournament.tournamentId());
        registration.setHorseId(horse.getHorseId());
        registration.setOwnerId(owner.getUserID());
        registration.setJockeyId(null);
        registration.setStatus(REGISTRATION_PENDING_JOCKEY);
        registration = registrationRepository.save(registration);

        if (jockeyInvitationRepository.existsByRegistrationIdAndJockeyIdAndStatus(
                registration.getRegistrationId(), jockey.getUserID(), INVITATION_PENDING)) {
            throw new ApiException(HttpStatus.CONFLICT, "A pending invitation already exists for this jockey.");
        }

        JockeyInvitation invitation = JockeyInvitation.builder()
                .registrationId(registration.getRegistrationId())
                .ownerId(owner.getUserID())
                .jockeyId(jockey.getUserID())
                .expiredAt(request.getExpiredAt())
                .message(request.getMessage())
                .status(INVITATION_PENDING)
                .build();

        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    @Transactional
    @Override
    public JockeyInvitationResponse cancelInvitation(Integer invitationId) {
        User owner = getCurrentOwner();
        JockeyInvitation invitation = jockeyInvitationRepository
                .findByInvitationIdAndOwnerId(invitationId, owner.getUserID())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation does not exist."));

        if (!INVITATION_PENDING.equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending invitations can be cancelled.");
        }

        Registration registration = registrationRepository.findById(invitation.getRegistrationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Registration does not exist."));

        invitation.setStatus(INVITATION_CANCELLED);
        invitation.setRespondedAt(LocalDateTime.now());
        registration.setStatus(REGISTRATION_CANCELLED);
        registration.setJockeyId(null);

        registrationRepository.save(registration);
        return mapInvitationToResponse(jockeyInvitationRepository.save(invitation));
    }

    private User getCurrentOwner() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "User is not authenticated.");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Owner does not exist."));

        if (user.getRole() == null || !ROLE_OWNER.equals(user.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only owners can access this resource.");
        }

        return user;
    }

    private Horse getOwnedHorse(Integer horseId) {
        Integer ownerId = getCurrentOwner().getUserID();
        return horseRepository.findByHorseIdAndOwnerId(horseId, ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Horse does not exist."));
    }

    private User getJockey(Integer jockeyId) {
        User jockey = userRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Jockey does not exist."));

        if (jockey.getRole() == null || !ROLE_JOCKEY.equals(jockey.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected user is not a jockey.");
        }

        if (!jockeyProfileRepository.existsById(jockeyId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Jockey profile does not exist.");
        }

        return jockey;
    }

    private void validateHorseCanRegister(Horse horse, TournamentSnapshot tournament) {
        if (!STATUS_ACTIVE.equals(horse.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only active horses can be registered.");
        }

        if (tournament.registrationDeadline() != null
                && tournament.registrationDeadline().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tournament registration deadline has passed.");
        }

        if (tournament.maxParticipants() != null) {
            long activeRegistrations = registrationRepository.countByTournamentIdAndStatusIn(
                    tournament.tournamentId(),
                    List.of(REGISTRATION_PENDING_JOCKEY, REGISTRATION_CONFIRMED));
            if (activeRegistrations >= tournament.maxParticipants()) {
                throw new ApiException(HttpStatus.CONFLICT, "Tournament has reached maximum participants.");
            }
        }
    }

    private HorseResponse mapHorseToResponse(Horse horse) {
        List<Integer> registrationIds = registrationRepository.findRegistrationIdsByHorseId(horse.getHorseId());
        return HorseResponse.builder()
                .horseId(horse.getHorseId())
                .ownerId(horse.getOwnerId())
                .horseName(horse.getHorseName())
                .breed(horse.getBreed())
                .gender(horse.getGender())
                .color(horse.getColor())
                .dayOfBirth(horse.getDayOfBirth())
                .weight(horse.getWeight())
                .healthCertExpiry(horse.getHealthCertExpiry())
                .status(horse.getStatus())
                .registrationCount(registrationIds.size())
                .participated(hasActiveRegistration(registrationIds))
                .build();
    }

    private boolean hasActiveRegistration(Integer horseId) {
        return hasActiveRegistration(registrationRepository.findRegistrationIdsByHorseId(horseId));
    }

    private boolean hasActiveRegistration(Collection<Integer> registrationIds) {
        return !registrationIds.isEmpty()
                && registrationRepository.countByRegistrationIdInAndStatusIn(
                registrationIds,
                List.of(REGISTRATION_PENDING_JOCKEY, REGISTRATION_CONFIRMED)) > 0;
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

    private TournamentSnapshot getTournamentSnapshot(Integer tournamentId) {
        TournamentSnapshot tournament = getTournamentSnapshotOrNull(tournamentId);
        if (tournament == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist.");
        }
        return tournament;
    }

    private TournamentSnapshot getTournamentSnapshotOrNull(Integer tournamentId) {
        try {
            return jdbcTemplate.queryForObject("""
                    SELECT tournamentID, tournamentName, registrationDeadline, maxParticipants, status
                    FROM Tournament
                    WHERE tournamentID = ?
                    """,
                    (rs, rowNum) -> new TournamentSnapshot(
                            rs.getInt("tournamentID"),
                            rs.getString("tournamentName"),
                            rs.getTimestamp("registrationDeadline") != null
                                    ? rs.getTimestamp("registrationDeadline").toLocalDateTime()
                                    : null,
                            (Integer) rs.getObject("maxParticipants"),
                            rs.getString("status")),
                    tournamentId);
        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    private record TournamentSnapshot(
            Integer tournamentId,
            String tournamentName,
            LocalDateTime registrationDeadline,
            Integer maxParticipants,
            String status) {
    }
}
