package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.PrizeDistributionStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.OwnerTournamentRegistrationRequest;
import com.example.backend.dto.response.OwnerRegistrationPaymentResponse;
import com.example.backend.dto.response.OwnerRaceResponse;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.dto.response.TournamentConditionResponse;
import com.example.backend.dto.response.TournamentResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.OwnerApplication;
import com.example.backend.entity.PrizeDistribution;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.entity.UserVerification;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.OwnerApplicationRepository;
import com.example.backend.repository.PrizeDistributionRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.UserVerificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private static final List<String> RETRYABLE_PAYMENT_STATUSES = List.of(
            PaymentStatus.UNPAID,
            PaymentStatus.FAILED
    );

    private final RegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentConditionRepository tournamentConditionRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final JockeyProfileRepository jockeyProfileRepository;
    private final OwnerApplicationRepository ownerApplicationRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;
    private final PrizeDistributionRepository prizeDistributionRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceResultRepository raceResultRepository;
    private final RaceRepository raceRepository;
    private final UserVerificationRepository userVerificationRepository;
    private final VnpayPaymentService vnpayPaymentService;
    private final RegistrationAvailabilityService availabilityService;
    private final RegistrationEligibilityService eligibilityService;

    public OwnerTournamentRegistrationService(
            RegistrationRepository registrationRepository,
            TournamentRepository tournamentRepository,
            TournamentConditionRepository tournamentConditionRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            JockeyProfileRepository jockeyProfileRepository,
            OwnerApplicationRepository ownerApplicationRepository,
            JockeyInvitationRepository jockeyInvitationRepository,
            PrizeDistributionRepository prizeDistributionRepository,
            RaceEntryRepository raceEntryRepository,
            RaceResultRepository raceResultRepository,
            RaceRepository raceRepository,
            UserVerificationRepository userVerificationRepository,
            VnpayPaymentService vnpayPaymentService,
            RegistrationAvailabilityService availabilityService,
            RegistrationEligibilityService eligibilityService) {
        this.registrationRepository = registrationRepository;
        this.tournamentRepository = tournamentRepository;
        this.tournamentConditionRepository = tournamentConditionRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.ownerApplicationRepository = ownerApplicationRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
        this.prizeDistributionRepository = prizeDistributionRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceResultRepository = raceResultRepository;
        this.raceRepository = raceRepository;
        this.userVerificationRepository = userVerificationRepository;
        this.vnpayPaymentService = vnpayPaymentService;
        this.availabilityService = availabilityService;
        this.eligibilityService = eligibilityService;
    }

    @Transactional
    public OwnerRegistrationPaymentResponse submitRegistration(
            OwnerTournamentRegistrationRequest request,
            String clientIp
    ) {
        User owner = getCurrentOwner();
        Tournament tournament = getTournament(request.getTournamentId());
        validateTournamentOpen(tournament);

        Horse horse = getOwnedActiveHorse(request.getHorseId(), owner.getUserID());
        User jockey = getActiveJockeyWithProfile(request.getJockeyId());

        validateAcceptedInvitation(tournament, horse, owner, jockey);

        Registration existingRegistration = findExistingActiveRegistration(
                tournament,
                horse,
                owner,
                jockey
        );
        if (existingRegistration != null) {
            eligibilityService.validateParticipationRequirements(
                    tournament,
                    horse.getHorseId(),
                    owner.getUserID(),
                    jockey.getUserID()
            );
            return createPaymentResponseForExistingRegistration(
                    existingRegistration,
                    tournament,
                    clientIp
            );
        }

        eligibilityService.validateNewSubmission(
                tournament,
                horse.getHorseId(),
                owner.getUserID(),
                jockey.getUserID()
        );
        availabilityService.validatePaidRegistrationCanBeCreated(
                tournament,
                horse,
                owner,
                jockey
        );

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

        Registration savedRegistration = registrationRepository.save(registration);

        var paymentTransaction = vnpayPaymentService.createRegistrationFeePayment(
                savedRegistration,
                tournament,
                clientIp
        );

        return OwnerRegistrationPaymentResponse.builder()
                .registration(toResponse(savedRegistration))
                .paymentTransaction(vnpayPaymentService.toResponse(paymentTransaction))
                .paymentUrl(paymentTransaction.getPayUrl())
                .build();
    }

    private Registration findExistingActiveRegistration(
            Tournament tournament,
            Horse horse,
            User owner,
            User jockey
    ) {
        return registrationRepository
                .findActiveByTournamentHorseOwnerAndJockey(
                        tournament.getTournamentId(),
                        horse.getHorseId(),
                        owner.getUserID(),
                        jockey.getUserID(),
                        ACTIVE_REGISTRATION_STATUSES
                )
                .stream()
                .findFirst()
                .orElse(null);
    }

    private OwnerRegistrationPaymentResponse createPaymentResponseForExistingRegistration(
            Registration registration,
            Tournament tournament,
            String clientIp
    ) {
        if (PaymentStatus.PAID.equals(registration.getPaymentStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration fee has already been paid."
            );
        }

        if (!RETRYABLE_PAYMENT_STATUSES.contains(registration.getPaymentStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration cannot be paid from its current payment status."
            );
        }

        var paymentTransaction = vnpayPaymentService.createRegistrationFeePayment(
                registration,
                tournament,
                clientIp
        );

        return OwnerRegistrationPaymentResponse.builder()
                .registration(toResponse(registration))
                .paymentTransaction(vnpayPaymentService.toResponse(paymentTransaction))
                .paymentUrl(paymentTransaction.getPayUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TournamentResponse> getOpenTournaments() {
        getCurrentOwner();

        List<Tournament> tournaments = tournamentRepository
                .findOpenForRegistration(
                        EventStatus.OPEN_FOR_REGISTRATION,
                        LocalDateTime.now()
                );

        if (tournaments.isEmpty()) {
            return List.of();
        }

        List<Integer> tournamentIds = tournaments.stream()
                .map(Tournament::getTournamentId)
                .toList();
        Map<Integer, List<TournamentConditionResponse>> conditionsByTournament =
                tournamentConditionRepository.findByTournamentIds(tournamentIds)
                        .stream()
                        .collect(Collectors.groupingBy(
                                condition -> condition.getTournamentId(),
                                Collectors.mapping(
                                        condition -> TournamentConditionResponse.builder()
                                                .conditionId(condition.getConditionId())
                                                .conditionType(condition.getConditionType())
                                                .operator(condition.getOperator())
                                                .value(condition.getValue())
                                                .minValue(condition.getMinValue())
                                                .maxValue(condition.getMaxValue())
                                                .build(),
                                        Collectors.toList()
                                )
                        ));

        return tournaments.stream()
                .map(tournament -> toTournamentResponse(
                        tournament,
                        conditionsByTournament.getOrDefault(
                                tournament.getTournamentId(),
                                List.of()
                        )
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OwnerRaceResponse> getMyRaces() {
        User owner = getCurrentOwner();
        List<RaceEntryRepository.OwnerRaceProjection> ownerRaces =
                raceEntryRepository.findOwnerRaces(owner.getUserID());

        if (ownerRaces.isEmpty()) {
            return List.of();
        }

        List<Integer> raceIds = ownerRaces.stream()
                .map(RaceEntryRepository.OwnerRaceProjection::getRaceId)
                .distinct()
                .toList();

        Map<Integer, Long> resultCountByRaceId =
                raceResultRepository.countResultsByRaceIds(raceIds)
                        .stream()
                        .collect(Collectors.toMap(
                                RaceResultRepository.RaceResultCountProjection::getRaceId,
                                RaceResultRepository.RaceResultCountProjection::getResultCount
                        ));

        return ownerRaces.stream()
                .map(race -> toOwnerRaceResponse(
                        race,
                        resultCountByRaceId.getOrDefault(race.getRaceId(), 0L) > 0
                ))
                .toList();
    }

    @Transactional
    public void markOwnerPrizeDistributionPaid(Integer prizeDistributionId) {
        User owner = getCurrentOwner();
        PrizeDistribution distribution = prizeDistributionRepository
                .findByIdForUpdate(prizeDistributionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Prize payout row does not exist."
                ));

        if (!owner.getUserID().equals(distribution.getOwnerId())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Prize payout row does not belong to the current owner."
            );
        }

        if (!PrizeDistributionStatus.PENDING.equals(distribution.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only pending prize payout rows can be marked as paid."
            );
        }

        distribution.setStatus(PrizeDistributionStatus.PAID);
        distribution.setDistributedAt(LocalDateTime.now());
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

        OwnerApplication ownerApplication = owner == null
                ? null
                : ownerApplicationRepository
                .findFirstByUserIdOrderByApplicationIdDesc(owner.getUserID())
                .orElse(null);

        JockeyProfile jockeyProfile = jockey == null
                ? null
                : jockeyProfileRepository
                .findById(jockey.getUserID())
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
                .ownerName(resolveOwnerName(ownerApplication))
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .jockeyId(registration.getJockeyId())
                .jockeyName(jockeyProfile != null ? jockeyProfile.getFullName() : null)
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

    private String resolveOwnerName(OwnerApplication ownerApplication) {
        if (ownerApplication == null) {
            return null;
        }
        return ownerApplication.getStableName();
    }

    private TournamentResponse toTournamentResponse(
            Tournament tournament,
            List<TournamentConditionResponse> conditions
    ) {
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
                .conditions(conditions)
                .build();
    }

    private OwnerRaceResponse toOwnerRaceResponse(
            RaceEntryRepository.OwnerRaceProjection race,
            boolean officialResultAvailable
    ) {
        return OwnerRaceResponse.builder()
                .raceEntryId(race.getRaceEntryId())
                .raceId(race.getRaceId())
                .tournamentId(race.getTournamentId())
                .tournamentName(race.getTournamentName())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .trackImageUrl(race.getTrackImageUrl())
                .raceStartTime(race.getRaceStartTime())
                .raceEndTime(race.getRaceEndTime())
                .distance(race.getDistance())
                .maxRunners(race.getMaxRunners())
                .raceOrder(race.getRaceOrder())
                .raceStatus(race.getRaceStatus())
                .startingStall(race.getStartingStall())
                .raceEntryStatus(race.getRaceEntryStatus())
                .registrationId(race.getRegistrationId())
                .registrationNo(race.getRegistrationNo())
                .horseId(race.getHorseId())
                .horseName(race.getHorseName())
                .jockeyId(race.getJockeyId())
                .jockeyName(race.getJockeyName())
                .officialResultAvailable(officialResultAvailable)
                .build();
    }
}
