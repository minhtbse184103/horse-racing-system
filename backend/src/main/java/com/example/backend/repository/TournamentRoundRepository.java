package com.example.backend.repository;

import com.example.backend.entity.TournamentRound;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TournamentRoundRepository
        extends JpaRepository<TournamentRound, Integer> {

    List<TournamentRound> findByTournamentIdOrderByRoundOrderAsc(Integer tournamentId);
}