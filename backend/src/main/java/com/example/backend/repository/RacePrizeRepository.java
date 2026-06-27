package com.example.backend.repository;

import com.example.backend.entity.RacePrize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface RacePrizeRepository
        extends JpaRepository<RacePrize, Integer> {

    List<RacePrize> findByRaceIdOrderByRankPositionAsc(Integer raceId);

    void deleteByRaceId(Integer raceId);

    @Query("""
        select prize
        from RacePrize prize
        where prize.raceId in :raceIds
        order by prize.raceId asc, prize.rankPosition asc
        """)
    List<RacePrize> findByRaceIds(
            @Param("raceIds") Collection<Integer> raceIds
    );
}
