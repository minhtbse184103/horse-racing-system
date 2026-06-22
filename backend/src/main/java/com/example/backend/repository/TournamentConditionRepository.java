package com.example.backend.repository;

import com.example.backend.entity.TournamentCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TournamentConditionRepository
        extends JpaRepository<TournamentCondition, Integer> {

    List<TournamentCondition> findByTournamentIdOrderByConditionIdAsc(
            Integer tournamentId
    );

    void deleteByTournamentId(Integer tournamentId);
}
