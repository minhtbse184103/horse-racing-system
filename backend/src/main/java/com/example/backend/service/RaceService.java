package com.example.backend.service;

import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import com.example.backend.entity.RaceRound;
import com.example.backend.repository.RaceRoundRepository;
import com.example.backend.repository.RaceCategoryRepository;
import com.example.backend.repository.TournamentRepository;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
public class RaceService {
    private final RaceRoundRepository raceRoundRepository;
    private final RaceRepository raceRepository;
    private final TournamentRepository tournamentRepository;
    private final RaceCategoryRepository raceCategoryRepository;

    public RaceService(
        RaceRepository raceRepository,
        TournamentRepository tournamentRepository,
        RaceCategoryRepository raceCategoryRepository,
        RaceRoundRepository raceRoundRepository
) {
    this.raceRepository = raceRepository;
    this.tournamentRepository = tournamentRepository;
    this.raceCategoryRepository = raceCategoryRepository;
    this.raceRoundRepository = raceRoundRepository;
}

    public List<Race> getAllRaces() {
        return raceRepository.findAll();
    }
    public List<Race> getRacesByTournamentId(Integer tournamentId) {
    if (!tournamentRepository.existsById(tournamentId)) {
        throw new IllegalArgumentException("Tournament does not exist.");
    }

    return raceRepository.findByTournamentId(tournamentId);
}
public Race getRaceById(Integer id) {
    return raceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Race does not exist."));
}
    public Race createRace(CreateRaceRequest request) {
        var tournament = tournamentRepository.findById(request.getTournamentId())
        .orElseThrow(() -> new IllegalArgumentException("Tournament does not exist."));

if (!"Draft".equals(tournament.getStatus())) {
    throw new IllegalArgumentException("Only draft tournaments can have new races.");
}

        if (!raceCategoryRepository.existsById(request.getCategoryId())) {
            throw new IllegalArgumentException("Race category does not exist.");
        }
        if (request.getLaneCount() > request.getMaxParticipants()) {
            throw new IllegalArgumentException("Lane count cannot be greater than maximum participants.");
}
        Race race = new Race();

        race.setTournamentId(request.getTournamentId());
        race.setCategoryId(request.getCategoryId());
        race.setRaceName(request.getRaceName());
        race.setMaxParticipants(request.getMaxParticipants());
        race.setLaneCount(request.getLaneCount());
        race.setTrack(request.getTrack());
        race.setPrizePool(request.getPrizePool());
        race.setStatus("Draft");

        return raceRepository.save(race);
    }

    public Race updateRace(Integer id, UpdateRaceRequest request) {
    Race race = raceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Race does not exist."));

    if (!"Draft".equals(race.getStatus())) {
        throw new IllegalArgumentException("Only draft races can be updated.");
    }

    if (!raceCategoryRepository.existsById(request.getCategoryId())) {
        throw new IllegalArgumentException("Race category does not exist.");
    }

    if (request.getLaneCount() > request.getMaxParticipants()) {
        throw new IllegalArgumentException("Lane count cannot be greater than maximum participants.");
    }

    race.setCategoryId(request.getCategoryId());
    race.setRaceName(request.getRaceName());
    race.setMaxParticipants(request.getMaxParticipants());
    race.setLaneCount(request.getLaneCount());
    race.setTrack(request.getTrack());
    race.setPrizePool(request.getPrizePool());

    return raceRepository.save(race);
}
public Race cancelRace(Integer id) {
    Race race = raceRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Race does not exist."));

    if (!"Draft".equals(race.getStatus())) {
        throw new IllegalArgumentException("Only draft races can be cancelled.");
    }

    List<RaceRound> raceRounds = raceRoundRepository.findByRaceId(race.getRaceId());

    for (RaceRound raceRound : raceRounds) {
        raceRound.setStatus("Cancelled");
    }

    raceRoundRepository.saveAll(raceRounds);

    race.setStatus("Cancelled");

    return raceRepository.save(race);
}


}