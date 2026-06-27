package com.example.backend.service;

import com.example.backend.constant.ConditionOperator;
import com.example.backend.constant.ConditionType;
import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.CreateTournamentRequest;
import com.example.backend.dto.request.TournamentConditionRequest;
import com.example.backend.dto.request.UpdateTournamentRequest;
import com.example.backend.dto.response.*;
import com.example.backend.entity.*;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TournamentConditionRepository conditionRepository;
    private final RaceRepository raceRepository;
    private final RacePrizeRepository racePrizeRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final VenueImageStorageService venueImageStorageService;

    public TournamentService(
            TournamentRepository tournamentRepository,
            TournamentConditionRepository conditionRepository,
            RaceRepository raceRepository,
            RacePrizeRepository racePrizeRepository,
            RaceEntryRepository raceEntryRepository,
            RegistrationRepository registrationRepository,
            UserRepository userRepository,
            VenueImageStorageService venueImageStorageService
    ) {
        this.tournamentRepository = tournamentRepository;
        this.conditionRepository = conditionRepository;
        this.raceRepository = raceRepository;
        this.racePrizeRepository = racePrizeRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
        this.venueImageStorageService = venueImageStorageService;
    }

    @Transactional(readOnly = true)
    public List<AdminTournamentWorkspaceResponse> getAdminTournamentWorkspace() {
        List<Tournament> tournaments =
                tournamentRepository.findAllByOrderByCreatedAtDesc();

        if (tournaments.isEmpty()) {
            return List.of();
        }

        List<Integer> tournamentIds = tournaments.stream()
                .map(Tournament::getTournamentId)
                .toList();

        // Batch load conditions
        Map<Integer, List<TournamentConditionResponse>> conditionsByTournamentId =
                new HashMap<>();
        conditionRepository.findByTournamentIds(tournamentIds)
                .forEach(condition -> conditionsByTournamentId
                        .computeIfAbsent(
                                condition.getTournamentId(),
                                id -> new ArrayList<>()
                        )
                        .add(TournamentConditionResponse.builder()
                                .conditionId(condition.getConditionId())
                                .conditionType(condition.getConditionType())
                                .operator(condition.getOperator())
                                .value(condition.getValue())
                                .minValue(condition.getMinValue())
                                .maxValue(condition.getMaxValue())
                                .build())
                );

        // Batch load races
        List<Race> allRaces = raceRepository.findByTournamentIds(tournamentIds);
        Map<Integer, List<Race>> racesByTournamentId = allRaces.stream()
                .collect(Collectors.groupingBy(Race::getTournamentId));

        List<Integer> raceIds = allRaces.stream()
                .map(Race::getRaceId)
                .toList();

        // Batch load prizes
        Map<Integer, List<RacePrizeResponse>> prizesByRaceId = new HashMap<>();
        if (!raceIds.isEmpty()) {
            racePrizeRepository.findByRaceIds(raceIds)
                    .forEach(prize -> prizesByRaceId
                            .computeIfAbsent(
                                    prize.getRaceId(),
                                    id -> new ArrayList<>()
                            )
                            .add(RacePrizeResponse.builder()
                                    .racePrizeId(prize.getRacePrizeId())
                                    .raceId(prize.getRaceId())
                                    .rankPosition(prize.getRankPosition())
                                    .amount(prize.getAmount())
                                    .ownerPercent(prize.getOwnerPercent())
                                    .jockeyPercent(prize.getJockeyPercent())
                                    .build())
                    );
        }

        // Batch load assigned entry counts
        Map<Integer, Long> entryCountByRaceId = new HashMap<>();
        if (!raceIds.isEmpty()) {
            raceEntryRepository.countAssignedEntriesByRaceIds(
                            raceIds, RaceEntryStatus.ASSIGNED)
                    .forEach(projection ->
                            entryCountByRaceId.put(
                                    projection.getRaceId(),
                                    projection.getEntryCount()
                            )
                    );
        }

        // Batch load registration counts
        Map<Integer, Long> registrationCountByTournamentId = new HashMap<>();
        registrationRepository.countRegistrationsByTournamentIds(tournamentIds)
                .forEach(projection ->
                        registrationCountByTournamentId.put(
                                projection.getTournamentId(),
                                projection.getRegistrationCount()
                        )
                );

        // Batch load approved registration counts
        Map<Integer, Long> approvedCountByTournamentId = new HashMap<>();
        registrationRepository.countApprovedRegistrationsByTournamentIds(
                        tournamentIds,
                        List.of(RegistrationStatus.APPROVED)
                )
                .forEach(projection ->
                        approvedCountByTournamentId.put(
                                projection.getTournamentId(),
                                projection.getApprovedRegistrationCount()
                        )
                );

        // Assemble response in memory
        return tournaments.stream()
                .map(tournament -> {
                    Integer tid = tournament.getTournamentId();

                    List<RaceResponse> races = racesByTournamentId
                            .getOrDefault(tid, List.of())
                            .stream()
                            .map(race -> {
                                long entryCount = entryCountByRaceId
                                        .getOrDefault(race.getRaceId(), 0L);
                                return toRaceResponseWithData(
                                        race,
                                        prizesByRaceId.getOrDefault(
                                                race.getRaceId(), List.of()),
                                        entryCount
                                );
                            })
                            .toList();

                    return AdminTournamentWorkspaceResponse.builder()
                            .tournamentId(tid)
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
                            .raceCount(races.size())
                            .registrationCount(
                                    registrationCountByTournamentId
                                            .getOrDefault(tid, 0L)
                            )
                            .approvedRegistrationCount(
                                    approvedCountByTournamentId
                                            .getOrDefault(tid, 0L)
                            )
                            .conditions(
                                    conditionsByTournamentId
                                            .getOrDefault(tid, List.of())
                            )
                            .races(races)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TournamentResponse> getAllTournaments() {
        List<Tournament> tournaments = tournamentRepository.findAllByOrderByCreatedAtDesc();
        if (tournaments.isEmpty()) return List.of();

        List<Integer> ids = tournaments.stream()
                .map(Tournament::getTournamentId)
                .toList();

        Map<Integer, Long> raceCountById = raceRepository
                .countRacesByTournamentIds(ids)
                .stream()
                .collect(Collectors.toMap(
                        RaceRepository.RaceCountProjection::getTournamentId,
                        RaceRepository.RaceCountProjection::getRaceCount
                ));

        Map<Integer, Long> regCountById = registrationRepository
                .countRegistrationsByTournamentIds(ids)
                .stream()
                .collect(Collectors.toMap(
                        RegistrationRepository.TournamentRegistrationCountProjection::getTournamentId,
                        RegistrationRepository.TournamentRegistrationCountProjection::getRegistrationCount
                ));

        Map<Integer, Long> approvedCountById = registrationRepository
                .countApprovedRegistrationsByTournamentIds(ids, List.of(RegistrationStatus.APPROVED))
                .stream()
                .collect(Collectors.toMap(
                        RegistrationRepository.TournamentApprovedRegistrationCountProjection::getTournamentId,
                        RegistrationRepository.TournamentApprovedRegistrationCountProjection::getApprovedRegistrationCount
                ));

        Map<Integer, List<TournamentConditionResponse>> conditionsByTournamentId =
                conditionRepository.findByTournamentIds(ids)
                        .stream()
                        .collect(Collectors.groupingBy(
                                TournamentCondition::getTournamentId,
                                Collectors.mapping(c -> TournamentConditionResponse.builder()
                                        .conditionId(c.getConditionId())
                                        .conditionType(c.getConditionType())
                                        .operator(c.getOperator())
                                        .value(c.getValue())
                                        .minValue(c.getMinValue())
                                        .maxValue(c.getMaxValue())
                                        .build(),
                                        Collectors.toList()
                                )
                        ));

        return tournaments.stream().map(t -> {
            Integer tid = t.getTournamentId();
            return TournamentResponse.builder()
                    .tournamentId(tid)
                    .tournamentName(t.getTournamentName())
                    .description(t.getDescription())
                    .venue(t.getVenue())
                    .venueImageUrl(t.getVenueImageUrl())
                    .registrationOpenAt(t.getRegistrationOpenAt())
                    .registrationCloseAt(t.getRegistrationCloseAt())
                    .startDate(t.getStartDate())
                    .endDate(t.getEndDate())
                    .maxRegistrations(t.getMaxRegistrations())
                    .entryFee(t.getEntryFee())
                    .status(t.getStatus())
                    .createdBy(t.getCreatedBy())
                    .createdAt(t.getCreatedAt())
                    .updatedAt(t.getUpdatedAt())
                    .raceCount(raceCountById.getOrDefault(tid, 0L))
                    .registrationCount(regCountById.getOrDefault(tid, 0L))
                    .approvedRegistrationCount(approvedCountById.getOrDefault(tid, 0L))
                    .conditions(conditionsByTournamentId.getOrDefault(tid, List.of()))
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public TournamentDetailResponse getTournamentById(Integer tournamentId) {
        Tournament tournament = getTournament(tournamentId);
        return toDetailResponse(tournament);
    }

    @Transactional
    public TournamentDetailResponse uploadVenueImage(
            Integer tournamentId,
            MultipartFile file,
            String adminEmail
    ) {
        Tournament tournament = tournamentRepository
                .findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        getAdmin(adminEmail);

        String newImageUrl = venueImageStorageService.store(tournamentId,file);

        tournament.setVenueImageUrl(newImageUrl);
        Tournament savedTournament = tournamentRepository.save(tournament);


        return toDetailResponse(savedTournament);
    }

    @Transactional
    public TournamentDetailResponse removeVenueImage(
            Integer tournamentId,
            String adminEmail
    ) {
        Tournament tournament = tournamentRepository
                .findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        getAdmin(adminEmail);
        String previousImageUrl = tournament.getVenueImageUrl();
        tournament.setVenueImageUrl(null);

        Tournament savedTournament = tournamentRepository.save(tournament);
        venueImageStorageService.delete(tournamentId);

        return toDetailResponse(savedTournament);
    }

    @Transactional
    public TournamentDetailResponse createTournament(
            CreateTournamentRequest request,
            String adminEmail
    ) {
        validateTournamentDates(
                request.getRegistrationOpenAt(),
                request.getRegistrationCloseAt(),
                request.getStartDate(),
                request.getEndDate()
        );

        validateConditions(request.getConditions());

        User admin = getAdmin(adminEmail);

        Tournament tournament = new Tournament();
        applyTournamentFields(
                tournament,
                request.getTournamentName(),
                request.getDescription(),
                request.getVenue(),
                request.getRegistrationOpenAt(),
                request.getRegistrationCloseAt(),
                request.getStartDate(),
                request.getEndDate(),
                request.getMaxRegistrations(),
                request.getEntryFee()
        );

        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        tournament.setCreatedBy(admin.getUserID());

        Tournament savedTournament = tournamentRepository.save(tournament);

        saveConditions(
                savedTournament.getTournamentId(),
                request.getConditions()
        );

        return toDetailResponse(savedTournament);
    }

    @Transactional
    public TournamentDetailResponse updateTournament(
            Integer tournamentId,
            UpdateTournamentRequest request,
            String adminEmail
    ) {
        Tournament tournament = tournamentRepository
                .findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        getAdmin(adminEmail);
        validateTournamentCanBeModified(tournament);

        validateTournamentDates(
                request.getRegistrationOpenAt(),
                request.getRegistrationCloseAt(),
                request.getStartDate(),
                request.getEndDate()
        );

        validateConditions(request.getConditions());

        applyTournamentFields(
                tournament,
                request.getTournamentName(),
                request.getDescription(),
                request.getVenue(),
                request.getRegistrationOpenAt(),
                request.getRegistrationCloseAt(),
                request.getStartDate(),
                request.getEndDate(),
                request.getMaxRegistrations(),
                request.getEntryFee()
        );

        Tournament savedTournament = tournamentRepository.save(tournament);

        conditionRepository.deleteByTournamentId(tournamentId);
        conditionRepository.flush();

        saveConditions(
                tournamentId,
                request.getConditions()
        );

        return toDetailResponse(savedTournament);
    }

    @Transactional
    public TournamentDetailResponse cancelTournament(
            Integer tournamentId,
            String adminEmail
    ) {
        Tournament tournament = tournamentRepository
                .findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        getAdmin(adminEmail);
        validateTournamentCanBeModified(tournament);

        List<Race> races =
                raceRepository.findByTournamentIdOrderByRaceOrderAsc(tournamentId);

        List<Integer> raceIds = races.stream()
                .map(Race::getRaceId)
                .toList();

        for (Race race : races) {
            race.setStatus(EventStatus.CANCELLED);
        }

        raceRepository.saveAll(races);

        if (!raceIds.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            List<RaceEntry> assignedEntries = raceEntryRepository
                    .findByRaceIdInAndStatus(raceIds, RaceEntryStatus.ASSIGNED);
            for (RaceEntry entry : assignedEntries) {
                entry.setStatus(RaceEntryStatus.CANCELLED);
                entry.setCancelledAt(now);
                entry.setCancellationReason("Tournament cancelled.");
            }
            raceEntryRepository.saveAll(assignedEntries);
        }

        tournament.setStatus(EventStatus.CANCELLED);

        return toDetailResponse(tournamentRepository.save(tournament));
    }
    @Transactional
    public TournamentDetailResponse closeRegistration(Integer tournamentId) {
        Tournament tournament = tournamentRepository
                .findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(
                tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only a tournament open for registration can be closed."
            );
        }

        tournament.setStatus(EventStatus.REGISTRATION_CLOSED);

        List<Race> races =
                raceRepository.findByTournamentIdOrderByRaceOrderAsc(
                        tournamentId
                );

        for (Race race : races) {
            if (EventStatus.OPEN_FOR_REGISTRATION.equals(
                    race.getStatus())) {
                race.setStatus(EventStatus.REGISTRATION_CLOSED);
            }
        }

        raceRepository.saveAll(races);

        return toDetailResponse(tournamentRepository.save(tournament));
    }
    @Transactional
    public TournamentDetailResponse completeTournament(Integer tournamentId) {
        Tournament tournament = tournamentRepository
                .findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        if (EventStatus.CANCELLED.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "A cancelled tournament cannot be completed."
            );
        }

        if (EventStatus.COMPLETED.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament is already completed."
            );
        }

        List<Race> races =
                raceRepository.findByTournamentIdOrderByRaceOrderAsc(tournamentId);

        if (races.isEmpty()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament cannot be completed without races."
            );
        }

        boolean hasIncompleteRace = races.stream()
                .anyMatch(race ->
                        !EventStatus.COMPLETED.equals(race.getStatus()));

        if (hasIncompleteRace) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Every race must be completed before completing the tournament."
            );
        }

        tournament.setStatus(EventStatus.COMPLETED);

        return toDetailResponse(tournamentRepository.save(tournament));
    }

    private void validateTournamentCanBeModified(Tournament tournament) {
        if (registrationRepository.existsByTournamentId(
                tournament.getTournamentId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament cannot be modified after registrations exist."
            );
        }

        if (EventStatus.IN_PROGRESS.equals(tournament.getStatus())
                || EventStatus.COMPLETED.equals(tournament.getStatus())
                || EventStatus.CANCELLED.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament can no longer be modified."
            );
        }
    }

    private void validateTournamentDates(
            LocalDateTime registrationOpenAt,
            LocalDateTime registrationCloseAt,
            LocalDate startDate,
            LocalDate endDate
    ) {
        if (!registrationOpenAt.isBefore(registrationCloseAt)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Registration opening time must be before closing time."
            );
        }

        if (!registrationCloseAt.isBefore(startDate.atStartOfDay())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Registration must close before the tournament starts."
            );
        }

        if (startDate.isAfter(endDate)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Tournament start date cannot be after end date."
            );
        }

        if (startDate.isBefore(LocalDate.now())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Tournament start date cannot be in the past."
            );
        }

        if (registrationCloseAt.isBefore(LocalDateTime.now())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Registration closing time cannot be in the past."
            );
        }
    }

    private void validateConditions(
            List<TournamentConditionRequest> conditions
    ) {
        Set<String> usedTypes = new HashSet<>();

        for (TournamentConditionRequest condition : conditions) {
            String type = condition.getConditionType().trim().toUpperCase();
            String operator = condition.getOperator().trim().toUpperCase();

            if (!usedTypes.add(type)) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "A tournament cannot contain duplicate condition types."
                );
            }

            if (ConditionType.GENDER.equals(type)) {
                validateGenderCondition(condition, operator);
            } else {
                validateNumericCondition(condition, operator);
            }
        }
    }

    private void validateGenderCondition(
            TournamentConditionRequest condition,
            String operator
    ) {
        if (!ConditionOperator.EQ.equals(operator)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Gender conditions only support the EQ operator."
            );
        }

        if (condition.getValue() == null
                || condition.getValue().isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Gender condition requires a value."
            );
        }

        if (condition.getMinValue() != null
                || condition.getMaxValue() != null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Gender condition cannot use minimum or maximum values."
            );
        }
    }

    private void validateNumericCondition(
            TournamentConditionRequest condition,
            String operator
    ) {
        if (!ConditionOperator.NUMERIC_OPERATORS.contains(operator)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported numeric condition operator."
            );
        }

        if (ConditionOperator.BETWEEN.equals(operator)) {
            if (condition.getMinValue() == null
                    || condition.getMaxValue() == null) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "BETWEEN requires minimum and maximum values."
                );
            }

            if (condition.getMinValue()
                    .compareTo(condition.getMaxValue()) > 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Minimum value cannot exceed maximum value."
                );
            }

            if (condition.getValue() != null
                    && !condition.getValue().isBlank()) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "BETWEEN cannot contain a single value."
                );
            }

            return;
        }

        if (condition.getValue() == null
                || condition.getValue().isBlank()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Numeric condition requires a value."
            );
        }

        if (condition.getMinValue() != null
                || condition.getMaxValue() != null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This operator cannot use minimum or maximum values."
            );
        }

        try {
            BigDecimal numericValue =
                    new BigDecimal(condition.getValue().trim());

            if (numericValue.compareTo(BigDecimal.ZERO) < 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Condition value cannot be negative."
                );
            }
        } catch (NumberFormatException exception) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "AGE and WEIGHT condition values must be numeric."
            );
        }
    }

    private void saveConditions(
            Integer tournamentId,
            List<TournamentConditionRequest> requests
    ) {
        List<TournamentCondition> conditions = requests.stream()
                .map(request -> toConditionEntity(tournamentId, request))
                .toList();

        conditionRepository.saveAll(conditions);
    }

    private TournamentCondition toConditionEntity(
            Integer tournamentId,
            TournamentConditionRequest request
    ) {
        String type = request.getConditionType().trim().toUpperCase();
        String operator = request.getOperator().trim().toUpperCase();

        TournamentCondition condition = new TournamentCondition();
        condition.setTournamentId(tournamentId);
        condition.setConditionType(type);
        condition.setOperator(operator);
        condition.setMinValue(request.getMinValue());
        condition.setMaxValue(request.getMaxValue());

        if (request.getValue() != null
                && !request.getValue().isBlank()) {
            if (ConditionType.GENDER.equals(type)) {
                condition.setValue(
                        request.getValue().trim().toUpperCase()
                );
            } else {
                condition.setValue(
                        new BigDecimal(request.getValue().trim())
                                .stripTrailingZeros()
                                .toPlainString()
                );
            }
        }

        return condition;
    }

    private void applyTournamentFields(
            Tournament tournament,
            String tournamentName,
            String description,
            String venue,
            LocalDateTime registrationOpenAt,
            LocalDateTime registrationCloseAt,
            LocalDate startDate,
            LocalDate endDate,
            Integer maxRegistrations,
            BigDecimal entryFee
    ) {
        tournament.setTournamentName(tournamentName.trim());
        tournament.setDescription(normalizeNullable(description));
        tournament.setVenue(venue.trim());
        tournament.setRegistrationOpenAt(registrationOpenAt);
        tournament.setRegistrationCloseAt(registrationCloseAt);
        tournament.setStartDate(startDate);
        tournament.setEndDate(endDate);
        tournament.setMaxRegistrations(maxRegistrations);
        tournament.setEntryFee(entryFee);
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
                    "Only administrators can manage tournaments."
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

    private Tournament getTournament(Integer tournamentId) {
        return tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));
    }

    private TournamentDetailResponse toDetailResponse(
            Tournament tournament
    ) {
        Integer tournamentId = tournament.getTournamentId();

        List<Race> rawRaces = raceRepository
                .findByTournamentIdOrderByRaceOrderAsc(tournamentId);

        List<Integer> raceIds = rawRaces.stream()
                .map(Race::getRaceId)
                .toList();

        Map<Integer, List<RacePrizeResponse>> prizesByRaceId = raceIds.isEmpty()
                ? Map.of()
                : racePrizeRepository.findByRaceIds(raceIds)
                        .stream()
                        .collect(Collectors.groupingBy(
                                RacePrize::getRaceId,
                                Collectors.mapping(p -> RacePrizeResponse.builder()
                                        .racePrizeId(p.getRacePrizeId())
                                        .raceId(p.getRaceId())
                                        .rankPosition(p.getRankPosition())
                                        .amount(p.getAmount())
                                        .ownerPercent(p.getOwnerPercent())
                                        .jockeyPercent(p.getJockeyPercent())
                                        .build(),
                                        Collectors.toList()
                                )
                        ));

        Map<Integer, Long> entryCountByRaceId = raceIds.isEmpty()
                ? Map.of()
                : raceEntryRepository
                        .countAssignedEntriesByRaceIds(raceIds, RaceEntryStatus.ASSIGNED)
                        .stream()
                        .collect(Collectors.toMap(
                                RaceEntryRepository.RaceEntryCountProjection::getRaceId,
                                RaceEntryRepository.RaceEntryCountProjection::getEntryCount
                        ));

        List<RaceResponse> races = rawRaces.stream()
                .map(race -> toRaceResponseWithData(
                        race,
                        prizesByRaceId.getOrDefault(race.getRaceId(), List.of()),
                        entryCountByRaceId.getOrDefault(race.getRaceId(), 0L)
                ))
                .toList();

        return TournamentDetailResponse.builder()
                .tournamentId(tournamentId)
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
                .raceCount(races.size())
                .registrationCount(
                        registrationRepository.countByTournamentId(tournamentId)
                )
                .approvedRegistrationCount(
                        registrationRepository
                                .countByTournamentIdAndApprovalStatusIn(
                                        tournamentId,
                                        List.of(RegistrationStatus.APPROVED)
                                )
                )
                .conditions(getConditionResponses(tournamentId))
                .races(races)
                .build();
    }

    private List<TournamentConditionResponse> getConditionResponses(
            Integer tournamentId
    ) {
        return conditionRepository
                .findByTournamentIdOrderByConditionIdAsc(tournamentId)
                .stream()
                .map(condition ->
                        TournamentConditionResponse.builder()
                                .conditionId(condition.getConditionId())
                                .conditionType(condition.getConditionType())
                                .operator(condition.getOperator())
                                .value(condition.getValue())
                                .minValue(condition.getMinValue())
                                .maxValue(condition.getMaxValue())
                                .build()
                )
                .toList();
    }

    private RaceResponse toRaceResponseWithData(
            Race race,
            List<RacePrizeResponse> prizes,
            long entryCount
    ) {
        return RaceResponse.builder()
                .raceId(race.getRaceId())
                .tournamentId(race.getTournamentId())
                .raceName(race.getRaceName())
                .trackName(race.getTrackName())
                .raceStartTime(race.getRaceStartTime())
                .raceEndTime(race.getRaceEndTime())
                .distance(race.getDistance())
                .maxRunners(race.getMaxRunners())
                .raceOrder(race.getRaceOrder())
                .status(race.getStatus())
                .createdAt(race.getCreatedAt())
                .updatedAt(race.getUpdatedAt())
                .entryCount(entryCount)
                .availableStalls(Math.max(0, race.getMaxRunners() - entryCount))
                .prizes(prizes)
                .build();
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
