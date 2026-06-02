package com.example.backend.service;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceCategory;
import com.example.backend.repository.RaceCategoryRepository;
import com.example.backend.repository.RaceRepository;
import org.springframework.stereotype.Service;
import com.example.backend.entity.Tournament;
import com.example.backend.repository.TournamentRepository;


import java.util.List;

@Service
public class RaceRoundService {

    private final RaceRoundRepository raceRoundRepository;
    private final RaceRepository raceRepository;
    private final RaceCategoryRepository raceCategoryRepository;
    private final TournamentRepository tournamentRepository;

    public RaceRoundService(
            RaceRoundRepository raceRoundRepository,
            RaceRepository raceRepository,
            RaceCategoryRepository raceCategoryRepository,
            TournamentRepository tournamentRepository
    ) {
        this.raceRoundRepository = raceRoundRepository;
        this.raceRepository = raceRepository;
        this.raceCategoryRepository = raceCategoryRepository;
        this.tournamentRepository = tournamentRepository;
    }
    public List<RaceRound> getRaceRoundsByRaceId(Integer raceId) {
    if (!raceRepository.existsById(raceId)) {
        throw new IllegalArgumentException("Race does not exist.");
    }

    return raceRoundRepository.findByRaceId(raceId);
}
    public List<RaceRound> getAllRaceRounds() {
        return raceRoundRepository.findAll();
    }
    public RaceRound getRaceRoundById(Integer id) {
    return raceRoundRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Race round does not exist."));
}
    public RaceRound createRaceRound(CreateRaceRoundRequest request) {
        Race race = raceRepository.findById(request.getRaceId())
                .orElseThrow(() -> new IllegalArgumentException("Race does not exist."));
        if (!"Draft".equals(race.getStatus())) {
    throw new IllegalArgumentException("Only draft races can have new race rounds.");
}
        Tournament tournament = tournamentRepository.findById(race.getTournamentId())
                .orElseThrow(() -> new IllegalArgumentException("Tournament does not exist."));
        RaceCategory category = raceCategoryRepository.findById(race.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Race category does not exist."));

        if (request.getRoundNumber() < 1 || request.getRoundNumber() > category.getMaxRounds()) {
            throw new IllegalArgumentException("Round number must be between 1 and the category maximum rounds.");
        }

        if (raceRoundRepository.countByRaceIdAndStatusNot(request.getRaceId(), "Cancelled") >= category.getMaxRounds()) {
            throw new IllegalArgumentException("This race already has the maximum number of rounds for its category.");
        }

        if (raceRoundRepository.existsByRaceIdAndRoundNumberAndStatusNot(
                request.getRaceId(),
                request.getRoundNumber(),
                "Cancelled"
        )) {
            throw new IllegalArgumentException("This round number already exists for the race.");
        }
        if (request.getScheduledTime().toLocalDate().isBefore(tournament.getStartDate())
        ||      request.getScheduledTime().toLocalDate().isAfter(tournament.getEndDate())) {
            throw new IllegalArgumentException("Scheduled time must be within the tournament date range.");
}
        RaceRound raceRound = new RaceRound();

        raceRound.setRaceId(request.getRaceId());
        raceRound.setRoundNumber(request.getRoundNumber());
        raceRound.setDistance(request.getDistance());
        raceRound.setDistanceCoefficient(request.getDistanceCoefficient());
        raceRound.setScheduledTime(request.getScheduledTime());
        raceRound.setStatus("Scheduled");

        return raceRoundRepository.save(raceRound);
    }

    public RaceRound updateRaceRound(Integer id, UpdateRaceRoundRequest request) {
    RaceRound raceRound = raceRoundRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Race round does not exist."));

    if (!"Scheduled".equals(raceRound.getStatus())) {
        throw new IllegalArgumentException("Only scheduled race rounds can be updated.");
    }

    Race race = raceRepository.findById(raceRound.getRaceId())
            .orElseThrow(() -> new IllegalArgumentException("Race does not exist."));

    Tournament tournament = tournamentRepository.findById(race.getTournamentId())
            .orElseThrow(() -> new IllegalArgumentException("Tournament does not exist."));

    RaceCategory category = raceCategoryRepository.findById(race.getCategoryId())
            .orElseThrow(() -> new IllegalArgumentException("Race category does not exist."));

    if (request.getRoundNumber() < 1 || request.getRoundNumber() > category.getMaxRounds()) {
        throw new IllegalArgumentException("Round number must be between 1 and the category maximum rounds.");
    }

    if (raceRoundRepository.existsByRaceIdAndRoundNumberAndStatusNotAndRoundIdNot(
            raceRound.getRaceId(),
            request.getRoundNumber(),
            "Cancelled",
            raceRound.getRoundId()
    )) {
        throw new IllegalArgumentException("This round number already exists for the race.");
    }

    if (request.getScheduledTime().toLocalDate().isBefore(tournament.getStartDate())
            || request.getScheduledTime().toLocalDate().isAfter(tournament.getEndDate())) {
        throw new IllegalArgumentException("Scheduled time must be within the tournament date range.");
    }

    raceRound.setRoundNumber(request.getRoundNumber());
    raceRound.setDistance(request.getDistance());
    raceRound.setDistanceCoefficient(request.getDistanceCoefficient());
    raceRound.setScheduledTime(request.getScheduledTime());

    return raceRoundRepository.save(raceRound);
}
public RaceRound cancelRaceRound(Integer id) {
    RaceRound raceRound = raceRoundRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Race round does not exist."));

    if (!"Scheduled".equals(raceRound.getStatus())) {
        throw new IllegalArgumentException("Only scheduled race rounds can be cancelled.");
    }

    raceRound.setStatus("Cancelled");

    return raceRoundRepository.save(raceRound);
}
}
