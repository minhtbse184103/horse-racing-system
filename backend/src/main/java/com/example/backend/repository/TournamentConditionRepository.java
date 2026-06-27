package com.example.backend.repository;

import com.example.backend.entity.TournamentCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface TournamentConditionRepository
        extends JpaRepository<TournamentCondition, Integer> {

    List<TournamentCondition> findByTournamentIdOrderByConditionIdAsc(
            Integer tournamentId
    );

    void deleteByTournamentId(Integer tournamentId);

    @Query("""
        select condition
        from TournamentCondition condition
        where condition.tournamentId in :tournamentIds
        order by condition.tournamentId asc, condition.conditionId asc
        """)
    List<TournamentCondition> findByTournamentIds(
            @Param("tournamentIds") Collection<Integer> tournamentIds
    );
}
