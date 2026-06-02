package com.example.backend.service;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.example.backend.exception.ApiException;
import java.util.List;

@Service
public class TournamentService {
    private final RaceRepository raceRepository;
    private final RaceRoundRepository raceRoundRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

    public Tournament getTournamentById(Integer id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tournament does not exist."));
    }

    public TournamentService(
            TournamentRepository tournamentRepository,
            RaceRepository raceRepository,
            RaceRoundRepository raceRoundRepository,
            UserRepository userRepository) {
        this.tournamentRepository = tournamentRepository;
        this.raceRepository = raceRepository;
        this.raceRoundRepository = raceRoundRepository;
        this.userRepository = userRepository;
    }

    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    public Tournament createTournament(CreateTournamentRequest request, String adminEmail) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date.");
        }

        if (request.getRegistrationDeadline().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("Registration deadline cannot be after start date.");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Admin account does not exist."));

        Tournament tournament = new Tournament();
        tournament.setName(request.getName());
        tournament.setLocation(request.getLocation());
        tournament.setStartDate(request.getStartDate());
        tournament.setEndDate(request.getEndDate());
        tournament.setRegistrationDeadline(request.getRegistrationDeadline().atTime(23, 59, 59));
        tournament.setCreatedBy(admin.getUserID());
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
    tournament.setRegistrationDeadline(request.getRegistrationDeadline().atTime(23, 59, 59));

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
