package com.example.backend.repository;

import com.example.backend.entity.Race;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaceRepository extends JpaRepository<Race, Integer> {

    interface RaceCountProjection {
        Integer getTournamentId();
        long getRaceCount();
    }

    List<Race> findByTournamentIdOrderByRaceOrderAsc(Integer tournamentId);

    long countByTournamentId(Integer tournamentId);

    @Query("""
        select race.tournamentId as tournamentId, count(race) as raceCount
        from Race race
        where race.tournamentId in :tournamentIds
        group by race.tournamentId
        """)
    List<RaceCountProjection> countRacesByTournamentIds(
            @Param("tournamentIds") Collection<Integer> tournamentIds
    );

    boolean existsByTournamentIdAndRaceNameIgnoreCase(
            Integer tournamentId,
            String raceName
    );

    boolean existsByTournamentIdAndRaceOrder(
            Integer tournamentId,
            Integer raceOrder
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select race
            from Race race
            where race.raceId = :raceId
            """)
    Optional<Race> findByIdForUpdate(
            @Param("raceId") Integer raceId
    );
    List<Race> findAllByOrderByRaceStartTimeAsc();

    boolean existsByTournamentIdAndRaceNameIgnoreCaseAndRaceIdNot(
            Integer tournamentId,
            String raceName,
            Integer raceId
    );

    boolean existsByTournamentIdAndRaceOrderAndRaceIdNot(
            Integer tournamentId,
            Integer raceOrder,
            Integer raceId
    );

    @Query("""
            select count(race) > 0
            from Race race
            where race.tournamentId = :tournamentId
              and lower(race.trackName) = lower(:trackName)
              and race.status <> :cancelledStatus
              and race.raceStartTime < :endTime
              and race.raceEndTime > :startTime
            """)
    boolean existsOverlappingRaceOnTrack(
            @Param("tournamentId") Integer tournamentId,
            @Param("trackName") String trackName,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("cancelledStatus") String cancelledStatus
    );

    @Query("""
            select count(race) > 0
            from Race race
            where race.tournamentId = :tournamentId
              and race.raceId <> :raceId
              and lower(race.trackName) = lower(:trackName)
              and race.status <> :cancelledStatus
              and race.raceStartTime < :endTime
              and race.raceEndTime > :startTime
            """)
    boolean existsOverlappingRaceOnTrackExcludingRace(
            @Param("tournamentId") Integer tournamentId,
            @Param("raceId") Integer raceId,
            @Param("trackName") String trackName,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("cancelledStatus") String cancelledStatus
    );

    @Query("""
        select coalesce(max(race.raceOrder), 0)
        from Race race
        where race.tournamentId = :tournamentId
        """)
    int findMaximumRaceOrder(
            @Param("tournamentId") Integer tournamentId
    );

    @Query("""
        select race
        from Race race
        where race.tournamentId in :tournamentIds
        order by race.tournamentId asc, race.raceOrder asc
        """)
    List<Race> findByTournamentIds(
            @Param("tournamentIds") Collection<Integer> tournamentIds
    );

    @Query("""
        select race
        from Race race
        where race.status in :statuses
        order by race.raceStartTime asc
        """)
    List<Race> findByStatusIn(
            @Param("statuses") Collection<String> statuses
    );

}
