package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.dto.request.CreateRaceRequest;
import com.example.backend.dto.request.RacePrizeRequest;
import com.example.backend.dto.request.UpdateRaceRequest;
import com.example.backend.dto.response.RacePrizeResponse;
import com.example.backend.dto.response.RaceResponse;
import com.example.backend.dto.response.RaceResultPrizeResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RacePrize;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.response.AdminAssignableRaceResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RaceService {

    private static final Set<String> RACE_SETUP_TOURNAMENT_STATUSES =
            Set.of(
                    EventStatus.OPEN_FOR_REGISTRATION,
                    EventStatus.REGISTRATION_CLOSED
            );

    private final RaceRepository raceRepository;
    private final RacePrizeRepository racePrizeRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final RaceResultRepository raceResultRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final RaceRunWatchdogService raceRunWatchdogService;

    public RaceService(
            RaceRepository raceRepository,
            RacePrizeRepository racePrizeRepository,
            RaceEntryRepository raceEntryRepository,
            RaceResultRepository raceResultRepository,
            TournamentRepository tournamentRepository,
            UserRepository userRepository,
            RaceRunWatchdogService raceRunWatchdogService
    ) {
        this.raceRepository = raceRepository;
        this.racePrizeRepository = racePrizeRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceResultRepository = raceResultRepository;
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.raceRunWatchdogService = raceRunWatchdogService;
    }

    @Transactional(readOnly = true)
    public List<AdminAssignableRaceResponse> getAssignableRaces() {
        List<Race> races = raceRepository.findByStatusIn(
                List.of(
                        EventStatus.OPEN_FOR_REGISTRATION,
                        EventStatus.REGISTRATION_CLOSED,
                        EventStatus.READY
                )
        );

        if (races.isEmpty()) {
            return List.of();
        }

        List<Integer> tournamentIds = races.stream()
                .map(Race::getTournamentId)
                .distinct()
                .toList();

        Map<Integer, String> tournamentNameById = tournamentRepository
                .findAllById(tournamentIds)
                .stream()
                .collect(Collectors.toMap(
                        t -> t.getTournamentId(),
                        t -> t.getTournamentName()
                ));

        return races.stream()
                .map(race -> AdminAssignableRaceResponse.builder()
                        .raceId(race.getRaceId())
                        .tournamentId(race.getTournamentId())
                        .tournamentName(tournamentNameById.getOrDefault(
                                race.getTournamentId(), ""))
                        .raceName(race.getRaceName())
                        .trackName(race.getTrackName())
                        .raceStartTime(race.getRaceStartTime())
                        .raceEndTime(race.getRaceEndTime())
                        .distance(race.getDistance())
                        .maxRunners(race.getMaxRunners())
                        .raceOrder(race.getRaceOrder())
                        .status(race.getStatus())
                        .build()
                )
                .toList();
    }

    @Transactional
    public List<RaceResponse> getAllRaces() {
        return raceRepository.findAllByOrderByRaceStartTimeAsc()
                .stream()
                .map(this::refreshAndMap)
                .toList();
    }

    @Transactional
    public RaceResponse getRaceById(Integer raceId) {
        Race race = getRace(raceId);
        return refreshAndMap(race);
    }

    @Transactional
    public List<RaceResponse> getRacesByTournamentId(
            Integer tournamentId
    ) {
        if (!tournamentRepository.existsById(tournamentId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Tournament does not exist."
            );
        }

        return raceRepository
                .findByTournamentIdOrderByRaceOrderAsc(tournamentId)
                .stream()
                .map(this::refreshAndMap)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RaceResultPrizeResponse> getRaceResults(Integer raceId) {
        if (!raceRepository.existsById(raceId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Race does not exist."
            );
        }

        return raceResultRepository.findPrizeResultsByRaceId(raceId)
                .stream()
                .map(result -> RaceResultPrizeResponse.builder()
                        .resultId(result.getResultId())
                        .raceEntryId(result.getRaceEntryId())
                        .startingStall(result.getStartingStall())
                        .finishPosition(result.getFinishPosition())
                        .finishTime(result.getFinishTime())
                        .points(result.getPoints())
                        .prizeMoney(result.getPrizeMoney())
                        .recordedAt(result.getRecordedAt())
                        .horseId(result.getHorseId())
                        .horseName(result.getHorseName())
                        .ownerId(result.getOwnerId())
                        .ownerName(result.getOwnerName())
                        .jockeyId(result.getJockeyId())
                        .jockeyName(result.getJockeyName())
                        .prizeDistributionId(result.getPrizeDistributionId())
                        .totalPrize(result.getTotalPrize())
                        .ownerAmount(result.getOwnerAmount())
                        .jockeyAmount(result.getJockeyAmount())
                        .distributionStatus(result.getDistributionStatus())
                        .build())
                .toList();
    }

    @Transactional
    public RaceResponse createRace(CreateRaceRequest request, String adminEmail) {
        getAdmin(adminEmail);

        Tournament tournament = tournamentRepository
                .findByIdForUpdate(request.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        validateTournamentAllowsRaceSetup(tournament);

        validateRaceTime(
                request.getRaceStartTime(),
                request.getRaceEndTime(),
                tournament
        );

        validatePrizes(request.getPrizes());

        String raceName = request.getRaceName().trim();
        String trackName = request.getTrackName().trim();

        if (raceRepository.existsByTournamentIdAndRaceNameIgnoreCase(
                tournament.getTournamentId(),
                raceName
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race name already exists in this tournament."
            );
        }

        int raceOrder = request.getRaceOrder() != null
                ? request.getRaceOrder()
                : raceRepository.findMaximumRaceOrder(
                tournament.getTournamentId()) + 1;

        if (raceRepository.existsByTournamentIdAndRaceOrder(
                tournament.getTournamentId(),
                raceOrder
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race order already exists in this tournament."
            );
        }

        validateRaceDoesNotOverlapOnTrack(
                tournament.getTournamentId(),
                null,
                trackName,
                request.getRaceStartTime(),
                request.getRaceEndTime()
        );

        Race race = new Race();
        race.setTournamentId(tournament.getTournamentId());
        race.setRaceName(raceName);
        race.setTrackName(trackName);
        race.setRaceStartTime(request.getRaceStartTime());
        race.setRaceEndTime(request.getRaceEndTime());
        race.setDistance(request.getDistance());
        race.setMaxRunners(request.getMaxRunners());
        race.setRaceOrder(raceOrder);
        race.setStatus(EventStatus.OPEN_FOR_REGISTRATION);

        try {
            Race savedRace = raceRepository.saveAndFlush(race);
            savePrizes(savedRace.getRaceId(), request.getPrizes());

            return toResponse(savedRace);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race name or order conflicts with another race."
            );
        }
    }

    @Transactional
    public RaceResponse updateRace(
            Integer raceId,
            UpdateRaceRequest request,
            String adminEmail
    ) {
        getAdmin(adminEmail);

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        refreshRaceStatus(race);

        validateRaceCanBeModified(race);

        Tournament tournament = tournamentRepository
                .findByIdForUpdate(race.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        validateTournamentAllowsRaceSetup(tournament);

        validateRaceTime(
                request.getRaceStartTime(),
                request.getRaceEndTime(),
                tournament
        );

        validatePrizes(request.getPrizes());

        String raceName = request.getRaceName().trim();
        String trackName = request.getTrackName().trim();

        if (raceRepository
                .existsByTournamentIdAndRaceNameIgnoreCaseAndRaceIdNot(
                        tournament.getTournamentId(),
                        raceName,
                        raceId
                )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race name already exists in this tournament."
            );
        }

        int raceOrder = request.getRaceOrder() != null
                ? request.getRaceOrder()
                : race.getRaceOrder();

        if (raceRepository
                .existsByTournamentIdAndRaceOrderAndRaceIdNot(
                        tournament.getTournamentId(),
                        raceOrder,
                        raceId
                )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race order already exists in this tournament."
            );
        }

        validateRaceDoesNotOverlapOnTrack(
                tournament.getTournamentId(),
                raceId,
                trackName,
                request.getRaceStartTime(),
                request.getRaceEndTime()
        );

        long entryCount = raceEntryRepository.countByRaceIdAndStatus(raceId, RaceEntryStatus.ASSIGNED);

        if (request.getMaxRunners() < entryCount) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Maximum runners cannot be lower than existing entries."
            );
        }

        race.setRaceName(raceName);
        race.setTrackName(trackName);
        race.setRaceStartTime(request.getRaceStartTime());
        race.setRaceEndTime(request.getRaceEndTime());
        race.setDistance(request.getDistance());
        race.setMaxRunners(request.getMaxRunners());
        race.setRaceOrder(raceOrder);

        try {
            Race savedRace = raceRepository.saveAndFlush(race);

            racePrizeRepository.deleteByRaceId(raceId);
            racePrizeRepository.flush();
            savePrizes(raceId, request.getPrizes());

            return toResponse(savedRace);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race name, order, or prize rank conflicts."
            );
        }
    }

    @Transactional
    public RaceResponse closeRegistration(Integer raceId, String adminEmail) {
        getAdmin(adminEmail);

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        refreshRaceStatus(race);

        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only a race open for registration can be closed."
            );
        }

        race.setStatus(EventStatus.REGISTRATION_CLOSED);

        return toResponse(raceRepository.save(race));
    }

    @Transactional
    public RaceResponse completeRace(Integer raceId, String adminEmail) {
        getAdmin(adminEmail);

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        refreshRaceStatus(race);

        if (EventStatus.CANCELLED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "A cancelled race cannot be completed."
            );
        }

        if (EventStatus.COMPLETED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race is already completed."
            );
        }

        if (!EventStatus.IN_PROGRESS.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race must be in progress before it can be completed."
            );
        }

        if (race.getRaceEndTime() != null
                && LocalDateTime.now().isBefore(race.getRaceEndTime())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race cannot be completed before its scheduled end time."
            );
        }

        race.setStatus(EventStatus.COMPLETED);
        race.setRaceEngineToken(null);
        race.setRaceEngineTokenIssuedAt(null);

        return toResponse(raceRepository.save(race));
    }

    @Transactional
    public RaceResponse cancelRace(Integer raceId, String adminEmail) {
        getAdmin(adminEmail);

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        refreshRaceStatus(race);

        if (race.getRunStartedAt() != null
                || EventStatus.IN_PROGRESS.equals(race.getStatus())
                || EventStatus.COMPLETED.equals(race.getStatus())
                || EventStatus.CANCELLED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race can no longer be cancelled."
            );
        }

        if (raceEntryRepository.existsByRaceId(raceId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race cannot be cancelled after entries have been assigned."
            );
        }

        race.setStatus(EventStatus.CANCELLED);
        race.setRaceEngineToken(null);
        race.setRaceEngineTokenIssuedAt(null);

        return toResponse(raceRepository.save(race));
    }

    private void refreshRaceStatus(Race race) {
        if ((EventStatus.OPEN_FOR_REGISTRATION.equals(race.getStatus())
                || EventStatus.REGISTRATION_CLOSED.equals(race.getStatus()))
                && !LocalDateTime.now().isBefore(race.getRaceStartTime())) {

            race.setStatus(EventStatus.READY);
            raceRepository.save(race);

            updateTournamentToInProgress(race.getTournamentId());
        }
    }

    private void updateTournamentToInProgress(Integer tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        if (!EventStatus.CANCELLED.equals(tournament.getStatus())
                && !EventStatus.COMPLETED.equals(tournament.getStatus())
                && !EventStatus.IN_PROGRESS.equals(tournament.getStatus())) {

            tournament.setStatus(EventStatus.IN_PROGRESS);
            tournamentRepository.save(tournament);
        }
    }

    private void validateRaceCanBeModified(Race race) {
        if (EventStatus.READY.equals(race.getStatus())
                || EventStatus.IN_PROGRESS.equals(race.getStatus())
                || EventStatus.COMPLETED.equals(race.getStatus())
                || EventStatus.CANCELLED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race can no longer be modified."
            );
        }
    }

    private void validateTournamentAllowsRaceSetup(
            Tournament tournament
    ) {
        if (!RACE_SETUP_TOURNAMENT_STATUSES.contains(
                tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament does not allow race setup."
            );
        }
    }

    private void validateRaceTime(
            LocalDateTime startTime,
            LocalDateTime endTime,
            Tournament tournament
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

    private void validateRaceDoesNotOverlapOnTrack(
            Integer tournamentId,
            Integer raceId,
            String trackName,
            LocalDateTime startTime,
            LocalDateTime endTime
    ) {
        boolean overlaps = raceId == null
                ? raceRepository.existsOverlappingRaceOnTrack(
                        tournamentId,
                        trackName,
                        startTime,
                        endTime,
                        EventStatus.CANCELLED
                )
                : raceRepository.existsOverlappingRaceOnTrackExcludingRace(
                        tournamentId,
                        raceId,
                        trackName,
                        startTime,
                        endTime,
                        EventStatus.CANCELLED
                );

        if (overlaps) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race schedule overlaps with another race on the same track."
            );
        }
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
                    "Only administrators can manage races."
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

    private Race getRace(Integer raceId) {
        return raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));
    }

    private RaceResponse refreshAndMap(Race race) {
        refreshRaceStatus(race);
        return toResponse(race);
    }

    private RaceResponse toResponse(Race race) {
        long entryCount =
                raceEntryRepository.countByRaceIdAndStatus(race.getRaceId(),RaceEntryStatus.ASSIGNED);
        long resultCount = getResultCountsByRaceId(List.of(race.getRaceId()))
                .getOrDefault(race.getRaceId(), 0L);

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
                .runStartedAt(race.getRunStartedAt())
                .runStuck(raceRunWatchdogService.isStuck(race, resultCount))
                .runElapsedMinutes(raceRunWatchdogService.getElapsedMinutes(race))
                .runWatchdogTimeoutMinutes(
                        raceRunWatchdogService.getTimeoutMinutes()
                )
                .entryCount(entryCount)
                .availableStalls(
                        Math.max(0, race.getMaxRunners() - entryCount)
                )
                .prizes(prizes)
                .build();
    }

    private Map<Integer, Long> getResultCountsByRaceId(List<Integer> raceIds) {
        if (raceIds.isEmpty()) {
            return Map.of();
        }

        return raceResultRepository.countResultsByRaceIds(raceIds)
                .stream()
                .collect(Collectors.toMap(
                        RaceResultRepository.RaceResultCountProjection::getRaceId,
                        RaceResultRepository.RaceResultCountProjection::getResultCount
                ));
    }
}
