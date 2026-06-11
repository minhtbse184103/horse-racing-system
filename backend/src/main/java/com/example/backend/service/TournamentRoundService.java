package com.example.backend.service;

import com.example.backend.entity.TournamentRound;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.TournamentRoundRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TournamentRoundService {
    private final TournamentRoundRepository tournamentRoundRepository;
    private final TournamentRepository tournamentRepository;

    public TournamentRoundService(
            TournamentRoundRepository tournamentRoundRepository,
            TournamentRepository tournamentRepository
    ) {
        this.tournamentRoundRepository = tournamentRoundRepository;
        this.tournamentRepository = tournamentRepository;
    }

    public List<TournamentRound> getRoundsByTournamentId(Integer tournamentId) {
        if (!tournamentRepository.existsById(tournamentId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist.");
        }

        return tournamentRoundRepository
                .findByTournamentIdOrderByRoundOrderAsc(tournamentId);
    }

    public TournamentRound getRoundById(Integer id) {
        return tournamentRoundRepository.findById(id)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament round does not exist."
                ));
    }
}