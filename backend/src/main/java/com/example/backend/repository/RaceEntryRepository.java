package com.example.backend.repository;

import java.util.List;

import com.example.backend.entity.RaceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RaceEntryRepository extends JpaRepository<RaceEntry, Integer> {

    List<RaceEntry> findByRaceIdOrderByLaneNumberAsc(Integer raceId);

    boolean existsByRaceIdAndRegistrationId(
            Integer raceId,
            Integer registrationId);

    @Query("""
            select coalesce(max(e.laneNumber), 0)
            from RaceEntry e
            where e.raceId = :raceId
            """)
    int findMaxLaneNumber(@Param("raceId") Integer raceId);

    @Query("""
            select count(e) > 0
            from RaceEntry e
            join Race r on r.raceId = e.raceId
            where r.roundId = :roundId
              and e.registrationId = :registrationId
              and e.status <> :withdrawnStatus
            """)
    boolean existsActiveEntryByRoundAndRegistration(
            @Param("roundId") Integer roundId,
            @Param("registrationId") Integer registrationId,
            @Param("withdrawnStatus") String withdrawnStatus);
}
