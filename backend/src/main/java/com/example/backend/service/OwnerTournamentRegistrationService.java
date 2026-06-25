package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.OwnerTournamentRegistrationRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.dto.response.TournamentResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.OwnerApplication;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.OwnerApplicationRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OwnerTournamentRegistrationService {

    private static final String ACTIVE = "ACTIVE";
    private static final String ROLE_OWNER = "OWNER";
    private static final String ROLE_JOCKEY = "JOCKEY";
    private static final String INVITATION_ACCEPTED = "ACCEPTED";

    private static final List<String> ACTIVE_REGISTRATION_STATUSES = List.of(
            RegistrationStatus.PENDING,
            RegistrationStatus.APPROVED
    );

    private final RegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final JockeyProfileRepository jockeyProfileRepository;
    private final OwnerApplicationRepository ownerApplicationRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceRepository raceRepository;

    public OwnerTournamentRegistrationService(
            RegistrationRepository registrationRepository,
            TournamentRepository tournamentRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            JockeyProfileRepository jockeyProfileRepository,
            OwnerApplicationRepository ownerApplicationRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            RaceEntryRepository raceEntryRepository,
            RaceRepository raceRepository) {
        this.registrationRepository = registrationRepository;
        this.tournamentRepository = tournamentRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.ownerApplicationRepository = ownerApplicationRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceRepository = raceRepository;
    }

    @Transactional
    public RegistrationResponse submitRegistration(
            OwnerTournamentRegistrationRequest request
    ) {
        User owner = getCurrentOwner();
        Tournament tournament = getTournament(request.getTournamentId());
        validateTournamentOpen(tournament);

        Horse horse = getOwnedActiveHorse(request.getHorseId(), owner.getUserID());
        User jockey = getActiveJockeyWithProfile(request.getJockeyId());

        validateAcceptedInvitation(tournament, horse, owner, jockey);
        validateDuplicateHorseRegistration(tournament, horse);
        validateDuplicateOwnerRegistration(tournament, owner);
        validateJockeyAvailability(tournament, jockey);
        validateHorseJockeyAvailability(tournament, horse, jockey);

        LocalDateTime now = LocalDateTime.now();
        Registration registration = new Registration();
        registration.setTournamentId(tournament.getTournamentId());
        registration.setHorseId(horse.getHorseId());
        registration.setOwnerId(owner.getUserID());
        registration.setJockeyId(jockey.getUserID());
        registration.setRegistrationNo(generateRegistrationNo(tournament.getTournamentId()));
        registration.setPaymentStatus(PaymentStatus.UNPAID);
        registration.setApprovalStatus(RegistrationStatus.PENDING);
        registration.setSubmittedAt(now);

        return toResponse(registrationRepository.save(registration));
    }

    @Transactional(readOnly = true)
    public List<TournamentResponse> getOpenTournaments() {
        getCurrentOwner();

        return tournamentRepository
                .findOpenForRegistration(
                        EventStatus.OPEN_FOR_REGISTRATION,
                        LocalDateTime.now()
                )
                .stream()
                .map(this::toTournamentResponse)
                .toList();
    }

    private User getCurrentOwner() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated owner is required.");
        }

        User owner = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated owner does not exist."
                ));

        if (owner.getRole() == null
                || !ROLE_OWNER.equalsIgnoreCase(owner.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only owners can submit tournament registrations."
            );
        }

        if (!ACTIVE.equalsIgnoreCase(owner.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Owner account is not active.");
        }

        return owner;
    }

    private Tournament getTournament(Integer tournamentId) {
        return tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));
    }

    private Horse getOwnedActiveHorse(Integer horseId, Integer ownerId) {
        Horse horse = horseRepository.findByHorseIdAndOwnerId(horseId, ownerId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Horse does not exist or does not belong to the current owner."
                ));

        if (!ACTIVE.equalsIgnoreCase(horse.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Horse must be ACTIVE.");
        }

        return horse;
    }

    private User getActiveJockeyWithProfile(Integer jockeyId) {
        User jockey = userRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Jockey does not exist."
                ));

        if (jockey.getRole() == null
                || !ROLE_JOCKEY.equalsIgnoreCase(jockey.getRole().getRoleName())) {
            throw new ApiException(HttpStatus.CONFLICT, "Selected user is not a JOCKEY.");
        }

        if (!ACTIVE.equalsIgnoreCase(jockey.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Jockey account is not ACTIVE.");
        }

        jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Jockey profile does not exist."
                ));

        return jockey;
    }

    private void validateTournamentOpen(Tournament tournament) {
        LocalDateTime now = LocalDateTime.now();

        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament is not open for registration."
            );
        }

        if (tournament.getRegistrationOpenAt() == null
                || tournament.getRegistrationCloseAt() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament registration window is not configured."
            );
        }

        if (now.isBefore(tournament.getRegistrationOpenAt())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament registration has not opened yet."
            );
        }

        if (now.isAfter(tournament.getRegistrationCloseAt())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament registration is closed."
            );
        }
    }

    private void validateAcceptedInvitation(
            Tournament tournament,
            Horse horse,
            User owner,
            User jockey
    ) {
        boolean acceptedInvitationExists =
                jockeyInvitationRepository
                        .existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                                tournament.getTournamentId(),
                                horse.getHorseId(),
                                owner.getUserID(),
                                jockey.getUserID(),
                                INVITATION_ACCEPTED
                        );

        if (!acceptedInvitationExists) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "An ACCEPTED jockey invitation is required before registration."
            );
        }
    }

    private void validateDuplicateHorseRegistration(
            Tournament tournament,
            Horse horse
    ) {
        long duplicateCount =
                registrationRepository
                        .countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                                tournament.getTournamentId(),
                                horse.getHorseId(),
                                ACTIVE_REGISTRATION_STATUSES,
                                null
                        );

        if (duplicateCount > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse already has an active registration in this tournament."
            );
        }
    }

    private void validateDuplicateOwnerRegistration(
            Tournament tournament,
            User owner
    ) {
        long duplicateCount =
                registrationRepository
                        .countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                                tournament.getTournamentId(),
                                owner.getUserID(),
                                ACTIVE_REGISTRATION_STATUSES,
                                null
                        );

        if (duplicateCount > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Owner already has an active registration in this tournament."
            );
        }
    }

    private void validateJockeyAvailability(
            Tournament tournament,
            User jockey
    ) {
        long sameTournamentCount =
                registrationRepository
                        .countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                                tournament.getTournamentId(),
                                jockey.getUserID(),
                                ACTIVE_REGISTRATION_STATUSES,
                                null
                        );

        if (sameTournamentCount > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Jockey already has an active registration in this tournament."
            );
        }

        long overlappingCount =
                registrationRepository
                        .countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
                                jockey.getUserID(),
                                tournament.getStartDate(),
                                tournament.getEndDate(),
                                ACTIVE_REGISTRATION_STATUSES,
                                null
                        );

        if (overlappingCount > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Jockey already has an active registration in an overlapping tournament."
            );
        }
    }

    private void validateHorseJockeyAvailability(
            Tournament tournament,
            Horse horse,
            User jockey
    ) {
        long overlappingCount =
                registrationRepository
                        .countByOverlappingTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
                                horse.getHorseId(),
                                jockey.getUserID(),
                                tournament.getStartDate(),
                                tournament.getEndDate(),
                                ACTIVE_REGISTRATION_STATUSES,
                                null
                        );

        if (overlappingCount > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse and jockey pair already has an active registration in an overlapping tournament."
            );
        }
    }

    private String generateRegistrationNo(Integer tournamentId) {
        return "REG-T" + tournamentId + "-" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10)
                .toUpperCase();
    }

    private RegistrationResponse toResponse(Registration registration) {
        Tournament tournament = tournamentRepository
                .findById(registration.getTournamentId())
                .orElse(null);

        Horse horse = horseRepository
                .findById(registration.getHorseId())
                .orElse(null);

        User owner = userRepository
                .findById(registration.getOwnerId())
                .orElse(null);

        User jockey = registration.getJockeyId() == null
                ? null
                : userRepository
                .findById(registration.getJockeyId())
                .orElse(null);

        RaceEntry raceEntry = registration.getRegistrationId() == null
                ? null
                : raceEntryRepository
                .findByRegistrationIdAndStatus(
                        registration.getRegistrationId(),
                        RaceEntryStatus.ASSIGNED
                )
                .orElse(null);

        Race race = raceEntry == null
                ? null
                : raceRepository
                .findById(raceEntry.getRaceId())
                .orElse(null);

        return RegistrationResponse.builder()
                .registrationId(registration.getRegistrationId())
                .registrationNo(registration.getRegistrationNo())
                .tournamentId(registration.getTournamentId())
                .tournamentName(tournament != null ? tournament.getTournamentName() : null)
                .horseId(registration.getHorseId())
                .horseName(horse != null ? horse.getHorseName() : null)
                .horseBreed(horse != null ? horse.getBreeding() : null)
                .horseGender(horse != null ? horse.getSex() : null)
                .horseDateOfBirth(horse != null ? horse.getDayOfBirth() : null)
                .horseWeight(horse != null ? horse.getWeight() : null)
                .horseHealthCertExpiry(horse != null ? horse.getHealthCertExpiry() : null)
                .horseStatus(horse != null ? horse.getStatus() : null)
                .ownerId(registration.getOwnerId())
                .ownerName(resolveOwnerFullName(owner))
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .jockeyId(registration.getJockeyId())
                .jockeyName(resolveJockeyFullName(jockey))
                .jockeyEmail(jockey != null ? jockey.getEmail() : null)
                .paymentStatus(registration.getPaymentStatus())
                .approvalStatus(registration.getApprovalStatus())
                .rejectionReason(registration.getRejectionReason())
                .submittedAt(registration.getSubmittedAt())
                .reviewedAt(registration.getReviewedAt())
                .reviewedBy(registration.getReviewedBy())
                .assigned(raceEntry != null)
                .assignedRaceId(race != null ? race.getRaceId() : null)
                .assignedRaceName(race != null ? race.getRaceName() : null)
                .createdAt(registration.getCreatedAt())
                .updatedAt(registration.getUpdatedAt())
                .build();
    }

    private String resolveOwnerFullName(User owner) {
        if (owner == null) {
            return null;
        }
        return ownerApplicationRepository.findFirstByUserIdOrderByApplicationIdDesc(owner.getUserID())
                .map(OwnerApplication::getFullName)
                .filter(name -> !name.isBlank())
                .orElse(owner.getUsername());
    }

    private String resolveJockeyFullName(User jockey) {
        if (jockey == null) {
            return null;
        }
        return jockeyProfileRepository.findById(jockey.getUserID())
                .map(JockeyProfile::getFullName)
                .filter(name -> !name.isBlank())
                .orElse(jockey.getUsername());
    }

    private TournamentResponse toTournamentResponse(Tournament tournament) {
        return TournamentResponse.builder()
                .tournamentId(tournament.getTournamentId())
                .tournamentName(tournament.getTournamentName())
                .description(tournament.getDescription())
                .venue(tournament.getVenue())
                .venueImageUrl(tournament.getVenueImageUrl())
                .registrationOpenAt(tournament.getRegistrationOpenAt())
                .registrationCloseAt(tournament.getRegistrationCloseAt())
                .startDate(tournament.getStartDate())
                .endDate(tournament.getEndDate())
                .maxRegistrations(tournament.getMaxRegistrations())
                .entryFee(tournament.getEntryFee())
                .status(tournament.getStatus())
                .createdBy(tournament.getCreatedBy())
                .createdAt(tournament.getCreatedAt())
                .updatedAt(tournament.getUpdatedAt())
                .raceCount(raceRepository.countByTournamentId(tournament.getTournamentId()))
                .registrationCount(registrationRepository.countByTournamentId(tournament.getTournamentId()))
                .approvedRegistrationCount(
                        registrationRepository.countByTournamentIdAndApprovalStatusIn(
                                tournament.getTournamentId(),
                                List.of(RegistrationStatus.APPROVED)
                        )
                )
                .build();
    }
}
