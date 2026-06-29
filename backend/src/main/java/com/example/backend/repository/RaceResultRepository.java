package com.example.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.RaceResult;

@Repository
public interface RaceResultRepository extends JpaRepository<RaceResult, Integer> {
    boolean existsByRaceEntryIdIn(Collection<Integer> raceEntryIds);

    interface RaceResultCountProjection {
        Integer getRaceId();
        long getResultCount();
    }

    @Query("""
        select entry.raceId as raceId, count(result) as resultCount
        from RaceResult result
        join RaceEntry entry on result.raceEntryId = entry.raceEntryId
        where entry.raceId in :raceIds
        group by entry.raceId
        """)
    List<RaceResultCountProjection> countResultsByRaceIds(
            @Param("raceIds") Collection<Integer> raceIds
    );
}
