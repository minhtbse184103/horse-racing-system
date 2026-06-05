package com.example.backend.service;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.example.backend.exception.ApiException;
import com.example.backend.constant.EventStatus;
import java.util.List;

@Service
public class TournamentService {
    private final RaceRepository raceRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

    public Tournament getTournamentById(Integer id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));
    }

    public TournamentService(
            TournamentRepository tournamentRepository,
            RaceRepository raceRepository,
            UserRepository userRepository) {
        this.tournamentRepository = tournamentRepository;
        this.raceRepository = raceRepository;
        this.userRepository = userRepository;
    }

    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    public Tournament createTournament(CreateTournamentRequest request, String adminEmail) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Start date cannot be after end date.");
        }

        if (request.getRegistrationDeadline().isAfter(request.getStartDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Registration deadline cannot be after start date.");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Admin account does not exist."));

        if (tournamentRepository.existsByLocationIgnoreCaseAndStartDateAndEndDateAndStatusNot(
                request.getLocation(),
                request.getStartDate(),
                request.getEndDate(),
                EventStatus.CANCELLED
        )) {
            throw new ApiException(HttpStatus.CONFLICT, "Tournament already exists at this location with the same start date and end date.");
        }

        Tournament tournament = new Tournament();
        tournament.setName(request.getName());
        tournament.setLocation(request.getLocation());
        tournament.setStartDate(request.getStartDate());
        tournament.setEndDate(request.getEndDate());
        tournament.setRegistrationDeadline(request.getRegistrationDeadline().atTime(23, 59, 59));
        tournament.setCreatedBy(admin.getUserID());
        tournament.setStatus(EventStatus.DRAFT);

        return tournamentRepository.save(tournament);
    }

    public Tournament updateTournament(Integer id, UpdateTournamentRequest request) {
    Tournament tournament = tournamentRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));

    if (!EventStatus.DRAFT.equals(tournament.getStatus())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft tournaments can be updated.");
    }

    if (request.getStartDate().isAfter(request.getEndDate())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Start date cannot be after end date.");
    }

    if (request.getRegistrationDeadline().isAfter(request.getStartDate())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Registration deadline cannot be after start date.");
    }

    if (tournamentRepository.existsByLocationIgnoreCaseAndStartDateAndEndDateAndStatusNotAndTournamentIdNot(
            request.getLocation(),
            request.getStartDate(),
            request.getEndDate(),
            EventStatus.CANCELLED,
            id
    )) {
        throw new ApiException(HttpStatus.CONFLICT, "Tournament already exists at this location with the same start date and end date.");
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
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));

    if (!EventStatus.DRAFT.equals(tournament.getStatus())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft tournaments can be cancelled.");
    }

    List<Race> races = raceRepository.findByTournamentId(tournament.getTournamentId());

    for (Race race : races) {
        race.setStatus(EventStatus.CANCELLED);
        race.setRaceNumber(null);

    }
    raceRepository.saveAll(races);

    tournament.setStatus(EventStatus.CANCELLED);

    return tournamentRepository.save(tournament);
}
}
