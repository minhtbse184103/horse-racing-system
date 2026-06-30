package com.example.backend.service;

import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.dto.request.RejectRegistrationRequest;
import com.example.backend.dto.request.UpdatePaymentStatusRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.entity.*;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Set;

@Service
public class AdminRegistrationService {

    private static final Set<String> REGISTRATION_STATUSES =
            Set.of(
                    RegistrationStatus.PENDING,
                    RegistrationStatus.APPROVED,
                    RegistrationStatus.REJECTED,
                    RegistrationStatus.CANCELLED
            );

    private static final Set<String> PAYMENT_STATUSES =
            Set.of(
                    PaymentStatus.UNPAID,
                    PaymentStatus.PAID,
                    PaymentStatus.REFUNDED,
                    PaymentStatus.FAILED
            );

    private final RegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceRepository raceRepository;
    private final RegistrationEligibilityService eligibilityService;
    private final DisplayNameResolver displayNameResolver;

    public AdminRegistrationService(
            RegistrationRepository registrationRepository,
            TournamentRepository tournamentRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            RaceEntryRepository raceEntryRepository,
            RaceRepository raceRepository,
            RegistrationEligibilityService eligibilityService,
            DisplayNameResolver displayNameResolver
    ) {
        this.registrationRepository = registrationRepository;
        this.tournamentRepository = tournamentRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceRepository = raceRepository;
        this.eligibilityService = eligibilityService;
        this.displayNameResolver = displayNameResolver;
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrations(String status) {
        if (status == null || status.isBlank()) {
            return toResponses(
                    registrationRepository
                            .findAllByOrderBySubmittedAtDesc()
            );
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!REGISTRATION_STATUSES.contains(normalizedStatus)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported registration status."
            );
        }

        return toResponses(
                registrationRepository
                        .findByApprovalStatusOrderBySubmittedAtDesc(
                                normalizedStatus
                        )
        );
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getPendingRegistrations() {
        return toResponses(
                registrationRepository
                        .findByApprovalStatusOrderBySubmittedAtAsc(
                                RegistrationStatus.PENDING
                        )
        );
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrationHistory() {
        return toResponses(
                registrationRepository
                        .findByApprovalStatusInOrderByReviewedAtDesc(
                                List.of(
                                        RegistrationStatus.APPROVED,
                                        RegistrationStatus.REJECTED,
                                        RegistrationStatus.CANCELLED
                                )
                        )
        );
    }

    @Transactional
    public RegistrationResponse approveRegistration(
            Integer registrationId,
            String adminEmail
    ) {
        Registration registration =
                getPendingRegistrationForUpdate(registrationId);

        Tournament tournament = tournamentRepository
                .findByIdForUpdate(registration.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        User admin = getAdmin(adminEmail);

        eligibilityService.validateForApproval(
                registration,
                tournament
        );

        registration.setApprovalStatus(
                RegistrationStatus.APPROVED
        );
        registration.setRejectionReason(null);
        registration.setReviewedAt(LocalDateTime.now());
        registration.setReviewedBy(admin.getUserID());

        return toResponse(
                registrationRepository.save(registration)
        );
    }

    @Transactional
    public RegistrationResponse rejectRegistration(
            Integer registrationId,
            RejectRegistrationRequest request,
            String adminEmail
    ) {
        Registration registration =
                getPendingRegistrationForUpdate(registrationId);

        User admin = getAdmin(adminEmail);

        registration.setApprovalStatus(
                RegistrationStatus.REJECTED
        );
        registration.setRejectionReason(
                request.getRejectionReason().trim()
        );
        registration.setReviewedAt(LocalDateTime.now());
        registration.setReviewedBy(admin.getUserID());

        return toResponse(
                registrationRepository.save(registration)
        );
    }

    @Transactional
    public RegistrationResponse updatePaymentStatus(
            Integer registrationId,
            UpdatePaymentStatusRequest request,
            String adminEmail
    ) {
        getAdmin(adminEmail);

        Registration registration = registrationRepository
                .findByIdForUpdate(registrationId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Registration does not exist."
                ));

        String paymentStatus =
                request.getPaymentStatus().trim().toUpperCase();

        if (!PAYMENT_STATUSES.contains(paymentStatus)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported payment status."
            );
        }
        if (RegistrationStatus.APPROVED.equals(
                registration.getApprovalStatus())
                && !PaymentStatus.PAID.equals(paymentStatus)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "An approved registration must remain PAID."
            );
        }
        registration.setPaymentStatus(paymentStatus);

        return toResponse(
                registrationRepository.save(registration)
        );
    }

    private Registration getPendingRegistrationForUpdate(
            Integer registrationId
    ) {
        Registration registration = registrationRepository
                .findByIdForUpdate(registrationId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Registration does not exist."
                ));

        if (!RegistrationStatus.PENDING.equals(
                registration.getApprovalStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only PENDING registrations can be reviewed."
            );
        }

        return registration;
    }

    private User getAdmin(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated administrator does not exist."
                ));

        if (admin.getRole() == null
                || !"ADMIN".equalsIgnoreCase(
                admin.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can review registrations."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(admin.getStatus())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Administrator account is not active."
            );
        }

        return admin;
    }

    private RegistrationResponse toResponse(
            Registration registration
    ) {
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

        User reviewer = registration.getReviewedBy() == null
                ? null
                : userRepository
                  .findById(registration.getReviewedBy())
                  .orElse(null);

        RaceEntry raceEntry = raceEntryRepository
                .findByRegistrationIdAndStatus(
                        registration.getRegistrationId(),
                        RaceEntryStatus.ASSIGNED)
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
                .tournamentName(
                        tournament != null
                                ? tournament.getTournamentName()
                                : null
                )

                .horseId(registration.getHorseId())
                .horseName(
                        horse != null ? horse.getHorseName() : null
                )
                .horseBreed(
                        horse != null ? horse.getBreeding() : null
                )
                .horseGender(
                        horse != null ? horse.getSex() : null
                )
                .horseDateOfBirth(
                        null
                )
                .horseWeight(
                        horse != null ? horse.getWeight() : null
                )
                .horseHealthCertExpiry(
                        horse != null
                                ? horse.getHealthCertExpiry()
                                : null
                )
                .horseStatus(
                        horse != null ? horse.getStatus() : null
                )

                .ownerId(registration.getOwnerId())
                .ownerName(
                        displayNameResolver.getOwnerDisplayName(owner)
                )
                .ownerEmail(
                        owner != null ? owner.getEmail() : null
                )

                .jockeyId(registration.getJockeyId())
                .jockeyName(
                        displayNameResolver.getJockeyDisplayName(jockey)
                )
                .jockeyEmail(
                        jockey != null ? jockey.getEmail() : null
                )

                .paymentStatus(registration.getPaymentStatus())
                .approvalStatus(registration.getApprovalStatus())
                .rejectionReason(registration.getRejectionReason())

                .submittedAt(registration.getSubmittedAt())
                .reviewedAt(registration.getReviewedAt())
                .reviewedBy(registration.getReviewedBy())
                .reviewerName(
                        reviewer != null
                                ? reviewer.getUsername()
                                : null
                )

                .assigned(raceEntry != null)
                .assignedRaceId(
                        race != null ? race.getRaceId() : null
                )
                .assignedRaceName(
                        race != null ? race.getRaceName() : null
                )

                .createdAt(registration.getCreatedAt())
                .updatedAt(registration.getUpdatedAt())
                .build();
    }

    private List<RegistrationResponse> toResponses(
            List<Registration> registrations
    ) {
        RegistrationLookupContext context =
                buildRegistrationLookupContext(registrations);

        return registrations.stream()
                .map(registration -> toResponse(registration, context))
                .toList();
    }

    private RegistrationResponse toResponse(
            Registration registration,
            RegistrationLookupContext context
    ) {
        Tournament tournament = context.tournaments()
                .get(registration.getTournamentId());
        Horse horse = context.horses().get(registration.getHorseId());
        User owner = context.users().get(registration.getOwnerId());
        User jockey = registration.getJockeyId() == null
                ? null
                : context.users().get(registration.getJockeyId());
        User reviewer = registration.getReviewedBy() == null
                ? null
                : context.users().get(registration.getReviewedBy());
        RaceEntry raceEntry = context.activeEntries()
                .get(registration.getRegistrationId());
        Race race = raceEntry == null
                ? null
                : context.races().get(raceEntry.getRaceId());

        return RegistrationResponse.builder()
                .registrationId(registration.getRegistrationId())
                .registrationNo(registration.getRegistrationNo())

                .tournamentId(registration.getTournamentId())
                .tournamentName(
                        tournament != null
                                ? tournament.getTournamentName()
                                : null
                )

                .horseId(registration.getHorseId())
                .horseName(
                        horse != null ? horse.getHorseName() : null
                )
                .horseBreed(
                        horse != null ? horse.getBreeding() : null
                )
                .horseGender(
                        horse != null ? horse.getSex() : null
                )
                .horseDateOfBirth(
                        null
                )
                .horseWeight(
                        horse != null ? horse.getWeight() : null
                )
                .horseHealthCertExpiry(
                        horse != null
                                ? horse.getHealthCertExpiry()
                                : null
                )
                .horseStatus(
                        horse != null ? horse.getStatus() : null
                )

                .ownerId(registration.getOwnerId())
                .ownerName(
                        displayNameResolver.getOwnerDisplayName(
                                owner,
                                context.ownerNames()
                        )
                )
                .ownerEmail(
                        owner != null ? owner.getEmail() : null
                )

                .jockeyId(registration.getJockeyId())
                .jockeyName(
                        displayNameResolver.getJockeyDisplayName(
                                jockey,
                                context.jockeyNames()
                        )
                )
                .jockeyEmail(
                        jockey != null ? jockey.getEmail() : null
                )

                .paymentStatus(registration.getPaymentStatus())
                .approvalStatus(registration.getApprovalStatus())
                .rejectionReason(registration.getRejectionReason())

                .submittedAt(registration.getSubmittedAt())
                .reviewedAt(registration.getReviewedAt())
                .reviewedBy(registration.getReviewedBy())
                .reviewerName(
                        reviewer != null
                                ? reviewer.getUsername()
                                : null
                )

                .assigned(raceEntry != null)
                .assignedRaceId(
                        race != null ? race.getRaceId() : null
                )
                .assignedRaceName(
                        race != null ? race.getRaceName() : null
                )

                .createdAt(registration.getCreatedAt())
                .updatedAt(registration.getUpdatedAt())
                .build();
    }

    private RegistrationLookupContext buildRegistrationLookupContext(
            List<Registration> registrations
    ) {
        if (registrations.isEmpty()) {
            return new RegistrationLookupContext(
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of()
            );
        }

        Set<Integer> tournamentIds = registrations.stream()
                .map(Registration::getTournamentId)
                .collect(Collectors.toSet());
        Set<Integer> horseIds = registrations.stream()
                .map(Registration::getHorseId)
                .collect(Collectors.toSet());
        Set<Integer> userIds = registrations.stream()
                .flatMap(registration -> java.util.stream.Stream.of(
                                registration.getOwnerId(),
                                registration.getJockeyId(),
                                registration.getReviewedBy()
                        ))
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        Set<Integer> registrationIds = registrations.stream()
                .map(Registration::getRegistrationId)
                .collect(Collectors.toSet());

        Map<Integer, Tournament> tournaments = mapById(
                tournamentRepository.findAllById(tournamentIds),
                Tournament::getTournamentId
        );
        Map<Integer, Horse> horses = mapById(
                horseRepository.findAllById(horseIds),
                Horse::getHorseId
        );
        Map<Integer, User> users = mapById(
                userRepository.findAllById(userIds),
                User::getUserID
        );
        Map<Integer, String> ownerNames =
                displayNameResolver.resolveOwnerNames(userIds);
        Map<Integer, String> jockeyNames =
                displayNameResolver.resolveJockeyNames(userIds);
        Map<Integer, RaceEntry> activeEntries = mapById(
                raceEntryRepository.findByRegistrationIdInAndStatus(
                        registrationIds,
                        RaceEntryStatus.ASSIGNED
                ),
                RaceEntry::getRegistrationId
        );
        Set<Integer> raceIds = activeEntries.values()
                .stream()
                .map(RaceEntry::getRaceId)
                .collect(Collectors.toSet());
        Map<Integer, Race> races = mapById(
                raceRepository.findAllById(raceIds),
                Race::getRaceId
        );

        return new RegistrationLookupContext(
                tournaments,
                horses,
                users,
                ownerNames,
                jockeyNames,
                activeEntries,
                races
        );
    }

    private <T> Map<Integer, T> mapById(
            Iterable<T> values,
            Function<T, Integer> idExtractor
    ) {
        return java.util.stream.StreamSupport.stream(
                        values.spliterator(),
                        false
                )
                .collect(Collectors.toMap(
                        idExtractor,
                        Function.identity(),
                        (current, ignored) -> current
                ));
    }

    private record RegistrationLookupContext(
            Map<Integer, Tournament> tournaments,
            Map<Integer, Horse> horses,
            Map<Integer, User> users,
            Map<Integer, String> ownerNames,
            Map<Integer, String> jockeyNames,
            Map<Integer, RaceEntry> activeEntries,
            Map<Integer, Race> races
    ) {
    }
}
