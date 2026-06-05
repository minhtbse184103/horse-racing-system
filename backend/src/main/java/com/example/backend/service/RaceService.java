package com.example.backend.service;

import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import com.example.backend.repository.RaceCategoryRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.constant.EventStatus;
import com.example.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
public class RaceService {
    private final RaceRepository raceRepository;
    private final TournamentRepository tournamentRepository;
    private final RaceCategoryRepository raceCategoryRepository;

    public RaceService(
        RaceRepository raceRepository,
        TournamentRepository tournamentRepository,
        RaceCategoryRepository raceCategoryRepository
) {
    this.raceRepository = raceRepository;
    this.tournamentRepository = tournamentRepository;
    this.raceCategoryRepository = raceCategoryRepository;
}

    public List<Race> getAllRaces() {
        return raceRepository.findAll();
    }
    public List<Race> getRacesByTournamentId(Integer tournamentId) {
    if (!tournamentRepository.existsById(tournamentId)) {
        throw new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist.");
    }

    return raceRepository.findByTournamentId(tournamentId);
}
public Race getRaceById(Integer id) {
    return raceRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race does not exist."));
}
    public Race createRace(CreateRaceRequest request) {
        var tournament = tournamentRepository.findById(request.getTournamentId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));

if (!EventStatus.DRAFT.equals(tournament.getStatus())) {
    throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft tournaments can have new races.");
}

        if (!raceCategoryRepository.existsById(request.getCategoryId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Race category does not exist.");
        }
        if (request.getLaneCount() > request.getMaxParticipants()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Lane count cannot be greater than maximum participants.");
}
        if (request.getScheduledTime().toLocalDate().isBefore(tournament.getStartDate())
                || request.getScheduledTime().toLocalDate().isAfter(tournament.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Race scheduled time must be within the tournament date range.");
        }

        if (raceRepository.existsByTournamentIdAndScheduledTimeAndStatusNot(
                request.getTournamentId(),
                request.getScheduledTime(),
                EventStatus.CANCELLED
        )) {
            throw new ApiException(HttpStatus.CONFLICT, "Another active race already exists at this scheduled time in this tournament");
        }
        Race race = new Race();

        race.setTournamentId(request.getTournamentId());
        race.setCategoryId(request.getCategoryId());
        race.setScheduledTime(request.getScheduledTime());
        race.setMaxParticipants(request.getMaxParticipants());
        race.setLaneCount(request.getLaneCount());
        race.setPrizePool(request.getPrizePool());
        race.setStatus(EventStatus.DRAFT);

        Race savedRace = raceRepository.save(race);

        reorderRaceNumbers(savedRace.getTournamentId());

        return savedRace;
    }

    public Race updateRace(Integer id, UpdateRaceRequest request) {
    Race race = raceRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race does not exist."));
        Tournament tournament = tournamentRepository.findById(race.getTournamentId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));

    if (!EventStatus.DRAFT.equals(race.getStatus())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft races can be updated.");
    }

    if (!raceCategoryRepository.existsById(request.getCategoryId())) {
        throw new ApiException(HttpStatus.NOT_FOUND, "Race category does not exist.");
    }

    if (request.getLaneCount() > request.getMaxParticipants()) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Lane count cannot be greater than maximum participants.");
    }
        if (request.getScheduledTime().toLocalDate().isBefore(tournament.getStartDate())
                || request.getScheduledTime().toLocalDate().isAfter(tournament.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Race scheduled time must be within the tournament date range.");
        }
        if (raceRepository.existsByTournamentIdAndScheduledTimeAndRaceIdNotAndStatusNot(
                race.getTournamentId(),
                request.getScheduledTime(),
                race.getRaceId(),
                EventStatus.CANCELLED
        )) {
            throw new ApiException(HttpStatus.CONFLICT, "Another active race already exists at this scheduled time in this tournament");
        }
    race.setCategoryId(request.getCategoryId());
        race.setScheduledTime(request.getScheduledTime());
    race.setMaxParticipants(request.getMaxParticipants());
    race.setLaneCount(request.getLaneCount());
    race.setPrizePool(request.getPrizePool());

    Race savedRace = raceRepository.save(race);
    reorderRaceNumbers(savedRace.getTournamentId());

    return savedRace;
}
public Race cancelRace(Integer id) {
    Race race = raceRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Race does not exist."));

    if (!EventStatus.DRAFT.equals(race.getStatus())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft races can be cancelled.");
    }


    race.setStatus(EventStatus.CANCELLED);
    race.setRaceNumber(null);

    Race savedRace = raceRepository.save(race);
    reorderRaceNumbers(savedRace.getTournamentId());

    return savedRace;
}

    private void reorderRaceNumbers(Integer tournamentId) {
        List<Race> races = raceRepository
                .findByTournamentIdAndStatusNotOrderByScheduledTimeAscRaceIdAsc(
                        tournamentId,
                        EventStatus.CANCELLED
                );

        for (int i = 0; i < races.size(); i++) {
            races.get(i).setRaceNumber(i + 1);
        }

        raceRepository.saveAll(races);
    }

}
