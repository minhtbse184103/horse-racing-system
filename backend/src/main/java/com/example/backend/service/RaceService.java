package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.dto.request.CreateRaceRequest;
import com.example.backend.dto.request.UpdateRaceRequest;
import com.example.backend.entity.Race;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentRound;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.TournamentRoundRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class RaceService {
    private static final Set<String> RACE_SETUP_TOURNAMENT_STATUSES = Set.of(
            EventStatus.DRAFT,
            EventStatus.OPEN_FOR_REGISTRATION,
            EventStatus.CLOSED_REGISTRATION
    );

    private final RaceRepository raceRepository;
    private final TournamentRoundRepository tournamentRoundRepository;
    private final TournamentRepository tournamentRepository;

    public RaceService(
            RaceRepository raceRepository,
            TournamentRoundRepository tournamentRoundRepository,
            TournamentRepository tournamentRepository
    ) {
        this.raceRepository = raceRepository;
        this.tournamentRoundRepository = tournamentRoundRepository;
        this.tournamentRepository = tournamentRepository;
    }

    public List<Race> getAllRaces() {
        return raceRepository.findAll();
    }

    public Race getRaceById(Integer id) {
        return raceRepository.findById(id)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));
    }

    public List<Race> getRacesByRoundId(Integer roundId) {
        if (!tournamentRoundRepository.existsById(roundId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Tournament round does not exist."
            );
        }

        return raceRepository.findByRoundIdOrderByRaceOrderAsc(roundId);
    }

    public List<Race> getRacesByTournamentId(Integer tournamentId) {
        if (!tournamentRepository.existsById(tournamentId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Tournament does not exist."
            );
        }

        List<Integer> roundIds = tournamentRoundRepository
                .findByTournamentIdOrderByRoundOrderAsc(tournamentId)
                .stream()
                .map(TournamentRound::getRoundId)
                .toList();

        if (roundIds.isEmpty()) {
            return List.of();
        }

        return raceRepository.findByRoundIdIn(roundIds);
    }

    @Transactional
    public Race createRace(CreateRaceRequest request) {
        TournamentRound round = getRound(request.getRoundId());
        Tournament tournament = getTournamentForUpdate(round.getTournamentId());

        validateTournamentAllowsRaceSetup(tournament);
        validateRaceTime(request.getStartTime(), request.getEndTime(), tournament);
        List<Integer> tournamentRoundIds =
                getTournamentRoundIds(tournament.getTournamentId());

        if (raceRepository.existsOverlappingRace(
                tournamentRoundIds,
                request.getStartTime(),
                request.getEndTime(),
                EventStatus.CANCELLED
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Another active race overlaps with this race time."
            );
        }
        long existingRaceCount = raceRepository.countByRoundId(round.getRoundId());

        if ("Final".equalsIgnoreCase(round.getRoundName()) && existingRaceCount >= 1) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Final round can have only one race."
            );
        }

        int raceOrder = Math.toIntExact(existingRaceCount + 1);

        Race race = new Race();
        race.setRoundId(round.getRoundId());
        race.setRaceOrder(raceOrder);
        race.setRaceName(generateRaceName(round, raceOrder));
        race.setStartTime(request.getStartTime());
        race.setEndTime(request.getEndTime());
        race.setDistance(request.getDistance());
        race.setStatus(EventStatus.DRAFT);

        return saveRace(race);
    }

    @Transactional
    public Race updateRace(Integer id, UpdateRaceRequest request) {
        Race race = getRaceById(id);
        TournamentRound round = getRound(race.getRoundId());
        Tournament tournament = getTournamentForUpdate(round.getTournamentId());

        validateTournamentAllowsRaceSetup(tournament);

        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Only draft races can be updated."
            );
        }

        validateRaceTime(request.getStartTime(), request.getEndTime(), tournament);
        List<Integer> tournamentRoundIds =
                getTournamentRoundIds(tournament.getTournamentId());

        if (raceRepository.existsOverlappingRaceExcludingCurrent(
                tournamentRoundIds,
                race.getRaceId(),
                request.getStartTime(),
                request.getEndTime(),
                EventStatus.CANCELLED
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Another active race overlaps with this race time."
            );
        }
        race.setStartTime(request.getStartTime());
        race.setEndTime(request.getEndTime());
        race.setDistance(request.getDistance());

        return saveRace(race);
    }

    @Transactional
    public Race cancelRace(Integer id) {
        Race race = getRaceById(id);
        TournamentRound round = getRound(race.getRoundId());
        Tournament tournament = getTournamentForUpdate(round.getTournamentId());

        validateTournamentAllowsRaceSetup(tournament);

        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Only draft races can be cancelled."
            );
        }

        race.setStatus(EventStatus.CANCELLED);
        return saveRace(race);
    }

    private TournamentRound getRound(Integer roundId) {
        return tournamentRoundRepository.findById(roundId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament round does not exist."
                ));
    }

    private void validateTournamentAllowsRaceSetup(Tournament tournament) {
        if (!RACE_SETUP_TOURNAMENT_STATUSES.contains(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Races can only be configured while registration is not ongoing or finished."
            );
        }
    }

    private void validateRaceTime(
            java.time.LocalDateTime startTime,
            java.time.LocalDateTime endTime,
            Tournament tournament
    ) {
        if (!startTime.isBefore(endTime)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Race start time must be before end time."
            );
        }

        if (startTime.toLocalDate().isBefore(tournament.getStartDate())
                || endTime.toLocalDate().isAfter(tournament.getEndDate())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Race time must be within the tournament date range."
            );
        }
    }

    private String generateRaceName(TournamentRound round, int raceOrder) {
        if ("Final".equalsIgnoreCase(round.getRoundName())) {
            return "Final";
        }

        return round.getRoundName() + " " + raceOrder;
    }

    private List<Integer> getTournamentRoundIds(Integer tournamentId) {
        return tournamentRoundRepository
                .findByTournamentIdOrderByRoundOrderAsc(tournamentId)
                .stream()
                .map(TournamentRound::getRoundId)
                .toList();
    }

    private Tournament getTournamentForUpdate(Integer tournamentId) {
        return tournamentRepository.findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));
    }

    private Race saveRace(Race race) {
        try {
            return raceRepository.saveAndFlush(race);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race order or name already exists."
            );
        }
    }
}
