package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.CreateRaceEntryRequest;
import com.example.backend.dto.request.CancelRaceEntryRequest;
import com.example.backend.dto.response.RaceEntryCandidateResponse;
import com.example.backend.dto.response.RaceEntryResponse;
import com.example.backend.entity.*;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class RaceEntryService {

    private static final Set<String> ASSIGNABLE_RACE_STATUSES =
            Set.of(
                    EventStatus.OPEN_FOR_REGISTRATION,
                    EventStatus.REGISTRATION_CLOSED
            );

    private final RaceEntryRepository raceEntryRepository;
    private final RaceRepository raceRepository;
    private final RegistrationRepository registrationRepository;
    private final TournamentRepository tournamentRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final DisplayNameResolver displayNameResolver;

    public RaceEntryService(
            RaceEntryRepository raceEntryRepository,
            RaceRepository raceRepository,
            RegistrationRepository registrationRepository,
            TournamentRepository tournamentRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            DisplayNameResolver displayNameResolver
    ) {
        this.raceEntryRepository = raceEntryRepository;
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.tournamentRepository = tournamentRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.displayNameResolver = displayNameResolver;
    }

    @Transactional(readOnly = true)
    public List<RaceEntryCandidateResponse> getAssignmentQueue() {
        List<Registration> registrations = registrationRepository
                .findApprovedAndUnassigned(
                        RegistrationStatus.APPROVED,
                        PaymentStatus.PAID,
                        RaceEntryStatus.ASSIGNED
                );

        return toCandidateResponses(registrations);
    }

    @Transactional(readOnly = true)
    public List<RaceEntryCandidateResponse>
    getAssignmentQueueByTournament(Integer tournamentId) {

        if (!tournamentRepository.existsById(tournamentId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Tournament does not exist."
            );
        }

        List<Registration> registrations = registrationRepository
                .findApprovedAndUnassignedByTournament(
                        tournamentId,
                        RegistrationStatus.APPROVED,
                        PaymentStatus.PAID,
                        RaceEntryStatus.ASSIGNED
                );

        return toCandidateResponses(registrations);
    }

    @Transactional(readOnly = true)
    public List<RaceEntryResponse> getEntriesByRace(
            Integer raceId
    ) {
        if (!raceRepository.existsById(raceId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Race does not exist."
            );
        }

        List<RaceEntry> entries = raceEntryRepository
                .findByRaceIdAndStatusOrderByStartingStallAsc(
                        raceId,
                        RaceEntryStatus.ASSIGNED);

        return toResponses(entries);
    }

    @Transactional
    public RaceEntryResponse assignRegistration(
            CreateRaceEntryRequest request,
            String adminEmail
    ) {
        /*
         * Locking the Race serializes all stall draws for this Race.
         * Two Admin requests cannot read the same available stall list
         * at the same time.
         */
        Race race = raceRepository
                .findByIdForUpdate(request.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        Registration registration = registrationRepository
                .findByIdForUpdate(request.getRegistrationId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Registration does not exist."
                ));

        User admin = getAdmin(adminEmail);

        validateRaceCanReceiveEntry(race);
        validateRegistration(registration);
        validateSameTournament(race, registration);

        if (raceEntryRepository.existsByRegistrationIdAndStatus(
                registration.getRegistrationId(),
                RaceEntryStatus.ASSIGNED)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration has already been assigned to a race."
            );
        }

        long currentEntryCount =
                raceEntryRepository.countByRaceIdAndStatus(
                        race.getRaceId(),
                        RaceEntryStatus.ASSIGNED);

        if (currentEntryCount >= race.getMaxRunners()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has reached its maximum runner capacity."
            );
        }

        int startingStall = drawAvailableStartingStall(race);

        RaceEntry entry = new RaceEntry();
        entry.setRaceId(race.getRaceId());
        entry.setRegistrationId(registration.getRegistrationId());
        entry.setStartingStall(startingStall);
        entry.setStatus(RaceEntryStatus.ASSIGNED);
        entry.setAssignedBy(admin.getUserID());
        entry.setAssignedAt(LocalDateTime.now());

        try {
            return toResponse(
                    raceEntryRepository.saveAndFlush(entry)
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race entry conflicts with an existing assignment."
            );
        }
    }
    @Transactional
    public RaceEntryResponse cancelEntry(
            Integer raceEntryId,
            CancelRaceEntryRequest request,
            String authenticatedEmail
    ) {
        RaceEntry entry = raceEntryRepository
                .findByIdForUpdate(raceEntryId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race entry does not exist."
                ));

        if (!RaceEntryStatus.ASSIGNED.equals(entry.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only ASSIGNED race entries can be cancelled."
            );
        }

        Race race = raceRepository
                .findById(entry.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Assigned race does not exist."
                ));

        LocalDateTime now = LocalDateTime.now();

        if (race.getRaceStartTime() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race start time is not configured."
            );
        }

        if (!now.isBefore(race.getRaceStartTime())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race entry cannot be cancelled after the race starts."
            );
        }

        String cancellationReason = request == null
                || request.getCancellationReason() == null
                ? ""
                : request.getCancellationReason().trim();

        if (cancellationReason.isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Cancellation reason is required."
            );
        }

        User admin = getAdmin(authenticatedEmail);

        entry.setStatus(RaceEntryStatus.CANCELLED);
        entry.setCancelledAt(now);
        entry.setCancelledBy(admin.getUserID());
        entry.setCancellationReason(cancellationReason);

        try {
            return toResponse(
                    raceEntryRepository.saveAndFlush(entry)
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race entry could not be cancelled."
            );
        }
    }
    private int drawAvailableStartingStall(Race race) {
        List<Integer> occupiedStalls =
                raceEntryRepository.findOccupiedStartingStalls(
                        race.getRaceId(),
                        RaceEntryStatus.ASSIGNED
                );

        List<Integer> availableStalls = IntStream
                .rangeClosed(1, race.getMaxRunners())
                .filter(stall -> !occupiedStalls.contains(stall))
                .boxed()
                .toList();

        if (availableStalls.isEmpty()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race has no available starting stalls."
            );
        }

        int randomIndex = ThreadLocalRandom
                .current()
                .nextInt(availableStalls.size());

        return availableStalls.get(randomIndex);
    }

    private void validateRaceCanReceiveEntry(Race race) {
        if (!ASSIGNABLE_RACE_STATUSES.contains(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race is not available for entry assignment."
            );
        }

        if (!LocalDateTime.now().isBefore(
                race.getRaceStartTime())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Entries cannot be assigned after the race starts."
            );
        }

        if (race.getMaxRunners() == null
                || race.getMaxRunners() <= 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race maximum runner configuration is invalid."
            );
        }
    }

    private void validateRegistration(
            Registration registration
    ) {
        if (!RegistrationStatus.APPROVED.equals(
                registration.getApprovalStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only APPROVED registrations can be assigned."
            );
        }

        if (!PaymentStatus.PAID.equals(
                registration.getPaymentStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration must be PAID before assignment."
            );
        }
    }

    private void validateSameTournament(
            Race race,
            Registration registration
    ) {
        if (!race.getTournamentId().equals(
                registration.getTournamentId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race and Registration must belong to the same Tournament."
            );
        }
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
                    "Only administrators can assign RaceEntries."
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

    private RaceEntryCandidateResponse toCandidateResponse(
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

        return RaceEntryCandidateResponse.builder()
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
                .ownerId(registration.getOwnerId())
                .ownerName(
                        displayNameResolver.getOwnerDisplayName(owner)
                )
                .jockeyId(registration.getJockeyId())
                .jockeyName(
                        displayNameResolver.getJockeyDisplayName(jockey)
                )
                .paymentStatus(registration.getPaymentStatus())
                .approvalStatus(registration.getApprovalStatus())
                .approvedAt(registration.getReviewedAt())
                .build();
    }

    private List<RaceEntryCandidateResponse> toCandidateResponses(
            List<Registration> registrations
    ) {
        CandidateLookupContext context = buildCandidateLookupContext(
                registrations
        );

        return registrations.stream()
                .map(registration -> toCandidateResponse(
                        registration,
                        context
                ))
                .toList();
    }

    private RaceEntryCandidateResponse toCandidateResponse(
            Registration registration,
            CandidateLookupContext context
    ) {
        Tournament tournament = context.tournaments()
                .get(registration.getTournamentId());
        Horse horse = context.horses().get(registration.getHorseId());
        User owner = context.users().get(registration.getOwnerId());
        User jockey = registration.getJockeyId() == null
                ? null
                : context.users().get(registration.getJockeyId());

        return RaceEntryCandidateResponse.builder()
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
                .ownerId(registration.getOwnerId())
                .ownerName(
                        displayNameResolver.getOwnerDisplayName(
                                owner,
                                context.ownerNames()
                        )
                )
                .jockeyId(registration.getJockeyId())
                .jockeyName(
                        displayNameResolver.getJockeyDisplayName(
                                jockey,
                                context.jockeyNames()
                        )
                )
                .paymentStatus(registration.getPaymentStatus())
                .approvalStatus(registration.getApprovalStatus())
                .approvedAt(registration.getReviewedAt())
                .build();
    }

    private RaceEntryResponse toResponse(RaceEntry entry) {
        Race race = raceRepository.findById(entry.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Assigned race does not exist."
                ));

        Registration registration = registrationRepository
                .findById(entry.getRegistrationId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Assigned registration does not exist."
                ));

        Tournament tournament = tournamentRepository
                .findById(race.getTournamentId())
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

        User assignedBy = userRepository
                .findById(entry.getAssignedBy())
                .orElse(null);

        return RaceEntryResponse.builder()
                .raceEntryId(entry.getRaceEntryId())
                .raceId(race.getRaceId())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .tournamentId(race.getTournamentId())
                .tournamentName(
                        tournament != null
                                ? tournament.getTournamentName()
                                : null
                )
                .registrationId(registration.getRegistrationId())
                .registrationNo(registration.getRegistrationNo())
                .horseId(registration.getHorseId())
                .horseName(
                        horse != null ? horse.getHorseName() : null
                )
                .ownerId(registration.getOwnerId())
                .ownerName(
                        displayNameResolver.getOwnerDisplayName(owner)
                )
                .jockeyId(registration.getJockeyId())
                .jockeyName(
                        displayNameResolver.getJockeyDisplayName(jockey)
                )
                .startingStall(entry.getStartingStall())
                .status(entry.getStatus())
                .assignedBy(entry.getAssignedBy())
                .assignedByName(
                        assignedBy != null
                                ? assignedBy.getUsername()
                                : null
                )
                .assignedAt(entry.getAssignedAt())
                .cancelledAt(entry.getCancelledAt())
                .cancelledBy(entry.getCancelledBy())
                .cancellationReason(entry.getCancellationReason())
                .build();
    }

    private List<RaceEntryResponse> toResponses(List<RaceEntry> entries) {
        RaceEntryLookupContext context = buildRaceEntryLookupContext(entries);

        return entries.stream()
                .map(entry -> toResponse(entry, context))
                .toList();
    }

    private RaceEntryResponse toResponse(
            RaceEntry entry,
            RaceEntryLookupContext context
    ) {
        Race race = context.races().get(entry.getRaceId());
        Registration registration = context.registrations()
                .get(entry.getRegistrationId());

        if (race == null) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Assigned race does not exist."
            );
        }

        if (registration == null) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Assigned registration does not exist."
            );
        }

        Tournament tournament = context.tournaments()
                .get(race.getTournamentId());
        Horse horse = context.horses().get(registration.getHorseId());
        User owner = context.users().get(registration.getOwnerId());
        User jockey = registration.getJockeyId() == null
                ? null
                : context.users().get(registration.getJockeyId());
        User assignedBy = context.users().get(entry.getAssignedBy());

        return RaceEntryResponse.builder()
                .raceEntryId(entry.getRaceEntryId())
                .raceId(race.getRaceId())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .tournamentId(race.getTournamentId())
                .tournamentName(
                        tournament != null
                                ? tournament.getTournamentName()
                                : null
                )
                .registrationId(registration.getRegistrationId())
                .registrationNo(registration.getRegistrationNo())
                .horseId(registration.getHorseId())
                .horseName(
                        horse != null ? horse.getHorseName() : null
                )
                .ownerId(registration.getOwnerId())
                .ownerName(
                        displayNameResolver.getOwnerDisplayName(
                                owner,
                                context.ownerNames()
                        )
                )
                .jockeyId(registration.getJockeyId())
                .jockeyName(
                        displayNameResolver.getJockeyDisplayName(
                                jockey,
                                context.jockeyNames()
                        )
                )
                .startingStall(entry.getStartingStall())
                .status(entry.getStatus())
                .assignedBy(entry.getAssignedBy())
                .assignedByName(
                        assignedBy != null
                                ? assignedBy.getUsername()
                                : null
                )
                .assignedAt(entry.getAssignedAt())
                .cancelledAt(entry.getCancelledAt())
                .cancelledBy(entry.getCancelledBy())
                .cancellationReason(entry.getCancellationReason())
                .build();
    }

    private CandidateLookupContext buildCandidateLookupContext(
            List<Registration> registrations
    ) {
        if (registrations.isEmpty()) {
            return new CandidateLookupContext(
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
        Set<Integer> userIds = registrationUserIds(registrations);

        return new CandidateLookupContext(
                mapById(
                        tournamentRepository.findAllById(tournamentIds),
                        Tournament::getTournamentId
                ),
                mapById(
                        horseRepository.findAllById(horseIds),
                        Horse::getHorseId
                ),
                mapById(
                        userRepository.findAllById(userIds),
                        User::getUserID
                ),
                displayNameResolver.resolveOwnerNames(userIds),
                displayNameResolver.resolveJockeyNames(userIds)
        );
    }

    private RaceEntryLookupContext buildRaceEntryLookupContext(
            List<RaceEntry> entries
    ) {
        if (entries.isEmpty()) {
            return new RaceEntryLookupContext(
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of(),
                    Map.of()
            );
        }

        Set<Integer> raceIds = entries.stream()
                .map(RaceEntry::getRaceId)
                .collect(Collectors.toSet());
        Set<Integer> registrationIds = entries.stream()
                .map(RaceEntry::getRegistrationId)
                .collect(Collectors.toSet());
        Map<Integer, Race> races = mapById(
                raceRepository.findAllById(raceIds),
                Race::getRaceId
        );
        Map<Integer, Registration> registrations = mapById(
                registrationRepository.findAllById(registrationIds),
                Registration::getRegistrationId
        );
        Set<Integer> tournamentIds = races.values()
                .stream()
                .map(Race::getTournamentId)
                .collect(Collectors.toSet());
        Set<Integer> horseIds = registrations.values()
                .stream()
                .map(Registration::getHorseId)
                .collect(Collectors.toSet());
        Set<Integer> userIds = registrations.values()
                .stream()
                .flatMap(registration -> java.util.stream.Stream.of(
                        registration.getOwnerId(),
                        registration.getJockeyId()
                ))
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        entries.stream()
                .flatMap(entry -> java.util.stream.Stream.of(
                        entry.getAssignedBy(),
                        entry.getCancelledBy()
                ))
                .filter(id -> id != null)
                .forEach(userIds::add);

        return new RaceEntryLookupContext(
                races,
                registrations,
                mapById(
                        tournamentRepository.findAllById(tournamentIds),
                        Tournament::getTournamentId
                ),
                mapById(
                        horseRepository.findAllById(horseIds),
                        Horse::getHorseId
                ),
                mapById(
                        userRepository.findAllById(userIds),
                        User::getUserID
                ),
                displayNameResolver.resolveOwnerNames(userIds),
                displayNameResolver.resolveJockeyNames(userIds)
        );
    }

    private Set<Integer> registrationUserIds(
            List<Registration> registrations
    ) {
        return registrations.stream()
                .flatMap(registration -> java.util.stream.Stream.of(
                        registration.getOwnerId(),
                        registration.getJockeyId()
                ))
                .filter(id -> id != null)
                .collect(Collectors.toSet());
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

    private record CandidateLookupContext(
            Map<Integer, Tournament> tournaments,
            Map<Integer, Horse> horses,
            Map<Integer, User> users,
            Map<Integer, String> ownerNames,
            Map<Integer, String> jockeyNames
    ) {
    }

    private record RaceEntryLookupContext(
            Map<Integer, Race> races,
            Map<Integer, Registration> registrations,
            Map<Integer, Tournament> tournaments,
            Map<Integer, Horse> horses,
            Map<Integer, User> users,
            Map<Integer, String> ownerNames,
            Map<Integer, String> jockeyNames
    ) {
    }
}
