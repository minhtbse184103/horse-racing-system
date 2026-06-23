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
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
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

    public RaceEntryService(
            RaceEntryRepository raceEntryRepository,
            RaceRepository raceRepository,
            RegistrationRepository registrationRepository,
            TournamentRepository tournamentRepository,
            HorseRepository horseRepository,
            UserRepository userRepository
    ) {
        this.raceEntryRepository = raceEntryRepository;
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.tournamentRepository = tournamentRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<RaceEntryCandidateResponse> getAssignmentQueue() {
        return registrationRepository
                .findApprovedAndUnassigned(
                        RegistrationStatus.APPROVED,
                        PaymentStatus.PAID,
                        RaceEntryStatus.ASSIGNED
                )
                .stream()
                .map(this::toCandidateResponse)
                .toList();
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

        return registrationRepository
                .findApprovedAndUnassignedByTournament(
                        tournamentId,
                        RegistrationStatus.APPROVED,
                        PaymentStatus.PAID,
                        RaceEntryStatus.ASSIGNED
                )
                .stream()
                .map(this::toCandidateResponse)
                .toList();
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

        return raceEntryRepository
                .findByRaceIdAndStatusOrderByStartingStallAsc(
                        raceId,
                        RaceEntryStatus.ASSIGNED)
                .stream()
                .map(this::toResponse)
                .toList();
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
                        owner != null ? owner.getUsername() : null
                )
                .jockeyId(registration.getJockeyId())
                .jockeyName(
                        jockey != null ? jockey.getUsername() : null
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
                        owner != null ? owner.getUsername() : null
                )
                .jockeyId(registration.getJockeyId())
                .jockeyName(
                        jockey != null ? jockey.getUsername() : null
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
}
