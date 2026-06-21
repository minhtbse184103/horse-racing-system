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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
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
        String previousImageUrl = tournament.getVenueImageUrl();
        String newImageUrl = venueImageStorageService.store(file);

        tournament.setVenueImageUrl(newImageUrl);
        Tournament savedTournament = tournamentRepository.save(tournament);
        venueImageStorageService.delete(previousImageUrl);

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
        venueImageStorageService.delete(previousImageUrl);

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
            UpdateTournamentRequest request
    ) {
        Tournament tournament = tournamentRepository
                .findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

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
    public TournamentDetailResponse cancelTournament(Integer tournamentId) {
        Tournament tournament = tournamentRepository
                .findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        validateTournamentCanBeModified(tournament);

        List<Race> races =
                raceRepository.findByTournamentIdOrderByRaceOrderAsc(tournamentId);

        for (Race race : races) {
            race.setStatus(EventStatus.CANCELLED);
        }

        raceRepository.saveAll(races);

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

        return admin;
    }

    private Tournament getTournament(Integer tournamentId) {
        return tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));
    }

    private TournamentResponse toResponse(Tournament tournament) {
        Integer tournamentId = tournament.getTournamentId();

        return TournamentResponse.builder()
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
                .raceCount(raceRepository.countByTournamentId(tournamentId))
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
                .build();
    }

    private TournamentDetailResponse toDetailResponse(
            Tournament tournament
    ) {
        Integer tournamentId = tournament.getTournamentId();

        List<RaceResponse> races = raceRepository
                .findByTournamentIdOrderByRaceOrderAsc(tournamentId)
                .stream()
                .map(this::toRaceResponse)
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

    private RaceResponse toRaceResponse(Race race) {
        long entryCount =
                raceEntryRepository.countByRaceIdAndStatus(race.getRaceId(), RaceEntryStatus.ASSIGNED);

        List<RacePrizeResponse> prizes = racePrizeRepository
                .findByRaceIdOrderByRankPositionAsc(race.getRaceId())
                .stream()
                .map(prize ->
                        RacePrizeResponse.builder()
                                .racePrizeId(prize.getRacePrizeId())
                                .raceId(prize.getRaceId())
                                .rankPosition(prize.getRankPosition())
                                .amount(prize.getAmount())
                                .ownerPercent(prize.getOwnerPercent())
                                .jockeyPercent(prize.getJockeyPercent())
                                .build()
                )
                .toList();

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
                .availableStalls(
                        Math.max(0, race.getMaxRunners() - entryCount)
                )
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
