package com.example.backend.service;

import com.example.backend.constant.ConditionOperator;
import com.example.backend.constant.ConditionType;
import com.example.backend.constant.EventStatus;
import com.example.backend.dto.request.CreateTournamentProgramRaceRequest;
import com.example.backend.dto.request.CreateTournamentProgramRequest;
import com.example.backend.dto.request.CreateTournamentRequest;
import com.example.backend.dto.request.RacePrizeRequest;
import com.example.backend.dto.request.TournamentConditionRequest;
import com.example.backend.dto.response.TournamentDetailResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RacePrize;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentCondition;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RacePrizeRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class TournamentProgramService {

    private final TournamentRepository tournamentRepository;
    private final TournamentConditionRepository conditionRepository;
    private final RaceRepository raceRepository;
    private final RacePrizeRepository racePrizeRepository;
    private final UserRepository userRepository;
    private final TournamentService tournamentService;

    public TournamentProgramService(
            TournamentRepository tournamentRepository,
            TournamentConditionRepository conditionRepository,
            RaceRepository raceRepository,
            RacePrizeRepository racePrizeRepository,
            UserRepository userRepository,
            TournamentService tournamentService
    ) {
        this.tournamentRepository = tournamentRepository;
        this.conditionRepository = conditionRepository;
        this.raceRepository = raceRepository;
        this.racePrizeRepository = racePrizeRepository;
        this.userRepository = userRepository;
        this.tournamentService = tournamentService;
    }

    @Transactional
    public TournamentDetailResponse createTournamentProgram(
            CreateTournamentProgramRequest request,
            String adminEmail
    ) {
        CreateTournamentRequest tournamentRequest = request.getTournament();
        validateTournamentDates(
                tournamentRequest.getRegistrationOpenAt(),
                tournamentRequest.getRegistrationCloseAt(),
                tournamentRequest.getStartDate(),
                tournamentRequest.getEndDate()
        );
        validateConditions(tournamentRequest.getConditions());
        User admin = getAdmin(adminEmail);

        List<ProgramRaceDraft> raceDrafts = validateProgramRaces(
                request.getRaces(),
                tournamentRequest
        );

        Tournament tournament = new Tournament();
        applyTournamentFields(tournament, tournamentRequest);
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        tournament.setCreatedBy(admin.getUserID());

        try {
            Tournament savedTournament = tournamentRepository.save(tournament);
            saveConditions(
                    savedTournament.getTournamentId(),
                    tournamentRequest.getConditions()
            );
            saveProgramRaces(savedTournament.getTournamentId(), raceDrafts);

            return tournamentService.getTournamentById(
                    savedTournament.getTournamentId()
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament program conflicts with existing data."
            );
        }
    }

    private List<ProgramRaceDraft> validateProgramRaces(
            List<CreateTournamentProgramRaceRequest> requests,
            CreateTournamentRequest tournament
    ) {
        if (requests == null || requests.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "At least one race is required."
            );
        }

        List<ProgramRaceDraft> drafts = new ArrayList<>();
        Set<String> usedNames = new HashSet<>();
        Set<Integer> usedOrders = new HashSet<>();
        int nextRaceOrder = 1;

        for (CreateTournamentProgramRaceRequest request : requests) {
            validateRaceTime(
                    request.getRaceStartTime(),
                    request.getRaceEndTime(),
                    tournament
            );
            validatePrizes(request.getPrizes());

            String raceName = request.getRaceName().trim();
            String normalizedName = raceName.toLowerCase(Locale.ROOT);
            if (!usedNames.add(normalizedName)) {
                throw new ApiException(
                        HttpStatus.CONFLICT,
                        "Race name already exists in this tournament."
                );
            }

            int raceOrder = request.getRaceOrder() != null
                    ? request.getRaceOrder()
                    : nextAvailableOrder(usedOrders, nextRaceOrder);
            if (!usedOrders.add(raceOrder)) {
                throw new ApiException(
                        HttpStatus.CONFLICT,
                        "Race order already exists in this tournament."
                );
            }
            nextRaceOrder = Math.max(nextRaceOrder, raceOrder + 1);

            drafts.add(new ProgramRaceDraft(
                    request,
                    raceName,
                    request.getTrackName().trim(),
                    raceOrder
            ));
        }

        validateProgramRaceOverlaps(drafts);
        return drafts;
    }

    private int nextAvailableOrder(Set<Integer> usedOrders, int nextRaceOrder) {
        int candidate = nextRaceOrder;
        while (usedOrders.contains(candidate)) {
            candidate++;
        }
        return candidate;
    }

    private void validateProgramRaceOverlaps(List<ProgramRaceDraft> races) {
        for (int firstIndex = 0; firstIndex < races.size(); firstIndex++) {
            ProgramRaceDraft first = races.get(firstIndex);
            for (int secondIndex = firstIndex + 1;
                 secondIndex < races.size();
                 secondIndex++) {
                ProgramRaceDraft second = races.get(secondIndex);
                if (!first.normalizedTrackName().equals(
                        second.normalizedTrackName())) {
                    continue;
                }

                if (first.request().getRaceStartTime()
                        .isBefore(second.request().getRaceEndTime())
                        && first.request().getRaceEndTime()
                        .isAfter(second.request().getRaceStartTime())) {
                    throw new ApiException(
                            HttpStatus.CONFLICT,
                            "Race schedule overlaps with another race on the same track."
                    );
                }
            }
        }
    }

    private void saveProgramRaces(
            Integer tournamentId,
            List<ProgramRaceDraft> raceDrafts
    ) {
        for (ProgramRaceDraft draft : raceDrafts) {
            CreateTournamentProgramRaceRequest request = draft.request();

            Race race = new Race();
            race.setTournamentId(tournamentId);
            race.setRaceName(draft.raceName());
            race.setTrackName(draft.trackName());
            race.setRaceStartTime(request.getRaceStartTime());
            race.setRaceEndTime(request.getRaceEndTime());
            race.setDistance(request.getDistance());
            race.setMaxRunners(request.getMaxRunners());
            race.setRaceOrder(draft.raceOrder());
            race.setStatus(EventStatus.OPEN_FOR_REGISTRATION);

            Race savedRace = raceRepository.save(race);
            savePrizes(savedRace.getRaceId(), request.getPrizes());
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

    private void validateRaceTime(
            LocalDateTime startTime,
            LocalDateTime endTime,
            CreateTournamentRequest tournament
    ) {
        if (!startTime.isBefore(endTime)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Race start time must be before end time."
            );
        }

        LocalDateTime tournamentStart =
                tournament.getStartDate().atStartOfDay();
        LocalDateTime tournamentEndExclusive =
                tournament.getEndDate().plusDays(1).atStartOfDay();

        if (startTime.isBefore(tournamentStart)
                || !endTime.isBefore(tournamentEndExclusive)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Race schedule must be inside the tournament date range."
            );
        }
    }

    private void validatePrizes(List<RacePrizeRequest> prizes) {
        if (prizes == null || prizes.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Race must contain at least one prize."
            );
        }

        Set<Integer> usedRanks = new HashSet<>();
        BigDecimal oneHundred = new BigDecimal("100");

        for (RacePrizeRequest prize : prizes) {
            if (!usedRanks.add(prize.getRankPosition())) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Race cannot contain duplicate prize ranks."
                );
            }

            if (prize.getOwnerPercent()
                    .add(prize.getJockeyPercent())
                    .compareTo(oneHundred) != 0) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Owner and jockey prize percentages must total 100."
                );
            }
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

    private void applyTournamentFields(
            Tournament tournament,
            CreateTournamentRequest request
    ) {
        tournament.setTournamentName(request.getTournamentName().trim());
        tournament.setDescription(normalizeNullable(request.getDescription()));
        tournament.setVenue(request.getVenue().trim());
        tournament.setRegistrationOpenAt(request.getRegistrationOpenAt());
        tournament.setRegistrationCloseAt(request.getRegistrationCloseAt());
        tournament.setStartDate(request.getStartDate());
        tournament.setEndDate(request.getEndDate());
        tournament.setMaxRegistrations(request.getMaxRegistrations());
        tournament.setEntryFee(request.getEntryFee());
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
                condition.setValue(request.getValue().trim().toUpperCase());
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

    private void savePrizes(
            Integer raceId,
            List<RacePrizeRequest> requests
    ) {
        List<RacePrize> prizes = requests.stream()
                .map(request -> {
                    RacePrize prize = new RacePrize();
                    prize.setRaceId(raceId);
                    prize.setRankPosition(request.getRankPosition());
                    prize.setAmount(request.getAmount());
                    prize.setOwnerPercent(request.getOwnerPercent());
                    prize.setJockeyPercent(request.getJockeyPercent());
                    return prize;
                })
                .toList();

        racePrizeRepository.saveAll(prizes);
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

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record ProgramRaceDraft(
            CreateTournamentProgramRaceRequest request,
            String raceName,
            String trackName,
            Integer raceOrder
    ) {
        String normalizedTrackName() {
            return trackName.toLowerCase(Locale.ROOT);
        }
    }
}
