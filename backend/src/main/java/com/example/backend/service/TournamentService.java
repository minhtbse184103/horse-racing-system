package com.example.backend.service;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import org.springframework.stereotype.Service;
import com.example.backend.entity.Race;
import com.example.backend.repository.RaceRepository;
import com.example.backend.entity.RaceRound;
import com.example.backend.repository.RaceRoundRepository;
import java.util.List;

@Service
public class TournamentService {
private final RaceRepository raceRepository;
private final RaceRoundRepository raceRoundRepository;
    private final TournamentRepository tournamentRepository;
    public Tournament getTournamentById(Integer id) {
    return tournamentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tournament does not exist."));
}
   public TournamentService(
        TournamentRepository tournamentRepository,
        RaceRepository raceRepository,
        RaceRoundRepository raceRoundRepository
) {
    this.tournamentRepository = tournamentRepository;
    this.raceRepository = raceRepository;
    this.raceRoundRepository = raceRoundRepository;
}

    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    public Tournament createTournament(CreateTournamentRequest request) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date.");
        }

        if (request.getRegistrationDeadline().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("Registration deadline cannot be after start date.");
        }

        Tournament tournament = new Tournament();

        tournament.setName(request.getName());
        tournament.setLocation(request.getLocation());
        tournament.setStartDate(request.getStartDate());
        tournament.setEndDate(request.getEndDate());
        tournament.setRegistrationDeadline(request.getRegistrationDeadline());
        tournament.setCreatedBy(null);
        tournament.setStatus("Draft");

        return tournamentRepository.save(tournament);
    }

    public Tournament updateTournament(Integer id, UpdateTournamentRequest request) {
    Tournament tournament = tournamentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tournament does not exist."));

    if (!"Draft".equals(tournament.getStatus())) {
        throw new IllegalArgumentException("Only draft tournaments can be updated.");
    }

    if (request.getStartDate().isAfter(request.getEndDate())) {
        throw new IllegalArgumentException("Start date cannot be after end date.");
    }

    if (request.getRegistrationDeadline().isAfter(request.getStartDate())) {
        throw new IllegalArgumentException("Registration deadline cannot be after start date.");
    }

    tournament.setName(request.getName());
    tournament.setLocation(request.getLocation());
    tournament.setStartDate(request.getStartDate());
    tournament.setEndDate(request.getEndDate());
    tournament.setRegistrationDeadline(request.getRegistrationDeadline());

    return tournamentRepository.save(tournament);
}
public Tournament cancelTournament(Integer id) {
    Tournament tournament = tournamentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tournament does not exist."));

    if (!"Draft".equals(tournament.getStatus())) {
        throw new IllegalArgumentException("Only draft tournaments can be cancelled.");
    }

    List<Race> races = raceRepository.findByTournamentId(tournament.getTournamentId());

    for (Race race : races) {
        race.setStatus("Cancelled");

        List<RaceRound> raceRounds = raceRoundRepository.findByRaceId(race.getRaceId());

        for (RaceRound raceRound : raceRounds) {
            raceRound.setStatus("Cancelled");
        }

        raceRoundRepository.saveAll(raceRounds);
    }

    raceRepository.saveAll(races);

    tournament.setStatus("Cancelled");

    return tournamentRepository.save(tournament);
}
}