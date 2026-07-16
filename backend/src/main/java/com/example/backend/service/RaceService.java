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
import org.springframework.web.multipart.MultipartFile;

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

    private static final int MIN_RUNNERS_TO_READY = 3;

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
    private final RaceTrackImageStorageService raceTrackImageStorageService;

    public RaceService(
            RaceRepository raceRepository,
            RacePrizeRepository racePrizeRepository,
            RaceEntryRepository raceEntryRepository,
            RaceResultRepository raceResultRepository,
            TournamentRepository tournamentRepository,
            UserRepository userRepository,
            RaceRunWatchdogService raceRunWatchdogService,
            RaceTrackImageStorageService raceTrackImageStorageService
    ) {
        this.raceRepository = raceRepository;
        this.racePrizeRepository = racePrizeRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.raceResultRepository = raceResultRepository;
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
        this.raceRunWatchdogService = raceRunWatchdogService;
        this.raceTrackImageStorageService = raceTrackImageStorageService;
    }

    @Transactional(readOnly = true)
    public List<AdminAssignableRaceResponse> getAssignableRaces() {
        // FLOW: Admin Referee Assignment Page Data Load
        // ORDER: 4C/7 - Service reads Race rows in assignable statuses before enriching them with Tournament names.
        // Validation: Race must be OPEN_FOR_REGISTRATION, REGISTRATION_CLOSED, or READY to appear as assignable.
        // DB effect: read-only Race query plus Tournament name lookup for the Referee assignment UI.
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
        // FLOW: Official Result Display
        // ORDER: 4/7 - Service verifies the Race exists before exposing official result rows.
        // Validation: Race exists. DB read returns official approved RaceResult rows joined with prize data.
        if (!raceRepository.existsById(raceId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Race does not exist."
            );
        }

        // FLOW: Prize Split Display
        // ORDER: 6/7 - Service maps repository projection fields into the official result/prize response DTO.
        // Maps the official RaceResult + PrizeDistribution projection into amounts shown in the result/prize dialog.
        return raceResultRepository.findPrizeResultsByRaceId(raceId)
                .stream()
                .map(result -> RaceResultPrizeResponse.builder()
                        .resultId(result.getResultId())
                        .raceEntryId(result.getRaceEntryId())
                        .startingStall(result.getStartingStall())
                        .finishPosition(result.getFinishPosition())
                        .finishTime(result.getFinishTime())
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6B/8 - Service validates and creates one new Race under an existing Tournament.
        // Validation: ACTIVE ADMIN, Tournament allows Race setup, unique Race name/order, valid time range, no same-track overlap, valid prize rules.
        // DB effect: creates one OPEN_FOR_REGISTRATION Race and its RacePrize rows under an existing Tournament.
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6C/8 - Service validates and updates one existing Race, then replaces its prize rules.
        // Validation: ACTIVE ADMIN, Race editable, no RaceEntry history, Tournament allows setup, valid schedule/overlap, maxRunners >= assigned entries, valid prize rules.
        // DB effect: updates Race fields and replaces RacePrize rows for the persisted Race.
        getAdmin(adminEmail);

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        refreshRaceStatus(race);

        validateRaceCanBeModified(race);
        validateRaceHasNoEntryHistory(raceId);

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
    public RaceResponse uploadTrackImage(
            Integer raceId,
            MultipartFile file,
            String adminEmail
    ) {
        // FLOW: Admin Tournament Images
        // ORDER: 5R/7 - RaceService validates admin/Race and stores the track image URL on Race.
        // Validation: Race exists and current user is ACTIVE ADMIN; storage service validates file type/size.
        // DB effect: stores image in Cloudinary, then saves returned secure URL on Race.trackImageUrl.
        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        getAdmin(adminEmail);

        String imageUrl = raceTrackImageStorageService.store(raceId, file);
        race.setTrackImageUrl(imageUrl);

        return toResponse(raceRepository.save(race));
    }

    @Transactional
    public RaceResponse removeTrackImage(
            Integer raceId,
            String adminEmail
    ) {
        // FLOW: Admin Tournament Images
        // ORDER: 5R/7 - RaceService validates admin/Race, clears URL, then deletes stored track image.
        // Validation: Race exists and current user is ACTIVE ADMIN.
        // DB effect: clears Race.trackImageUrl and deletes the Cloudinary object.
        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        getAdmin(adminEmail);

        race.setTrackImageUrl(null);
        Race savedRace = raceRepository.save(race);
        raceTrackImageStorageService.delete(raceId);

        return toResponse(savedRace);
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
    public RaceResponse markRaceReady(Integer raceId, String adminEmail) {
        // FLOW: Admin Mark Race READY
        // ORDER: 5/6 - Service locks Race and validates Admin, setup status, scheduled time, and minimum assigned entries.
        // Validation: Admin must be ACTIVE ADMIN; Race must be in setup status; scheduled start time must be reached; at least MIN_RUNNERS_TO_READY ASSIGNED RaceEntries must exist.
        // DB effect: sets Race status READY and moves the parent Tournament to IN_PROGRESS if needed.
        getAdmin(adminEmail);

        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        if (EventStatus.READY.equals(race.getStatus())) {
            return toResponse(race);
        }

        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(race.getStatus())
                && !EventStatus.REGISTRATION_CLOSED.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only a race waiting for setup can be marked ready."
            );
        }

        if (LocalDateTime.now().isBefore(race.getRaceStartTime())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race cannot be marked ready before its scheduled start time."
            );
        }

        long assignedEntries = raceEntryRepository.countByRaceIdAndStatus(
                raceId,
                RaceEntryStatus.ASSIGNED
        );

        // FLOW: Admin Mark Race READY
        // ORDER: 5A/6 - Minimum runner validation counts only active ASSIGNED RaceEntry rows; CANCELLED history does not count.
        if (assignedEntries < MIN_RUNNERS_TO_READY) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race needs at least " + MIN_RUNNERS_TO_READY
                            + " assigned entries before it can be marked ready."
            );
        }

        race.setStatus(EventStatus.READY);
        // FLOW: Admin Mark Race READY
        // ORDER: 6/6 - DB update stores Race READY and promotes parent Tournament to IN_PROGRESS for active event management.
        Race savedRace = raceRepository.save(race);
        updateTournamentToInProgress(savedRace.getTournamentId());

        return toResponse(savedRace);
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

        long officialResultCount = getResultCountsByRaceId(List.of(raceId))
                .getOrDefault(raceId, 0L);

        if (officialResultCount == 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race cannot be manually completed before official results exist."
            );
        }

        race.setStatus(EventStatus.COMPLETED);
        race.setRaceEngineToken(null);
        race.setRaceEngineTokenIssuedAt(null);

        return toResponse(raceRepository.save(race));
    }

    @Transactional
    public RaceResponse cancelRace(Integer raceId, String adminEmail) {
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6D/8 - Service validates Race cancellation for a Race removed from the edit wizard.
        // Validation: ACTIVE ADMIN, Race not launched/running/completed/cancelled, and no RaceEntry history exists.
        // DB effect: marks the Race CANCELLED and clears any engine token metadata; RaceEntry rows are not mutated.
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
        // READY is now an explicit admin action. A scheduled start time alone
        // must not promote the race because it may have no assigned entries.
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6C.1/8 - Validation helper blocks editing locked Race statuses.
        // Validation: READY/IN_PROGRESS/COMPLETED/CANCELLED Races are locked from edit.
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

    private void validateRaceHasNoEntryHistory(Integer raceId) {
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6C.2/8 - Validation helper blocks edits once RaceEntry history exists.
        // Validation: any RaceEntry history means the Race schedule/capacity/prize setup is no longer editable.
        if (raceEntryRepository.existsByRaceId(raceId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race cannot be modified after entries have been assigned."
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6B.1/8 - Validation helper checks Race schedule boundaries for create/update.
        // Validation: Race start must be before end, after now, and inside the Tournament date range.
        if (!startTime.isBefore(endTime)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Race start time must be before end time."
            );
        }

        if (!startTime.isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Race start time must be after the current time."
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6B.2/8 - Validation helper checks RacePrize rules for create/update.
        // Validation: RacePrize list is required, rank positions are unique, and Owner/Jockey percentages total 100.
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6B.3/8 - Validation helper rejects same-track schedule overlap inside the Tournament.
        // Validation: Race schedules may overlap across tracks, but not within the same Tournament and same track.
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
        // FLOW: Admin Edit Tournament Program
        // ORDER: 6B.4/8 - Persistence helper saves the current RacePrize rule set after Race validation.
        // DB effect: persists the current RacePrize rule set after create/update validation.
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
                .trackImageUrl(race.getTrackImageUrl())
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
