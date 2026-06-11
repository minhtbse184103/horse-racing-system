package com.example.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.example.backend.entity.Race;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RaceRepository extends JpaRepository<Race, Integer> {

    List<Race> findByRoundIdOrderByRaceOrderAsc(Integer roundId);

    long countByRoundId(Integer roundId);
    boolean existsByRoundIdAndRaceOrder(Integer roundId, Integer raceOrder);

    List<Race> findByRoundIdIn(List<Integer> roundIds);
    @Query("""
        SELECT COUNT(r) > 0
        FROM Race r
        WHERE r.roundId IN :roundIds
        AND r.status <> :cancelledStatus
        AND r.startTime < :endTime
        AND r.endTime > :startTime
        """)
    boolean existsOverlappingRace(
            @Param("roundIds") List<Integer> roundIds,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("cancelledStatus") String cancelledStatus
    );

    @Query("""
        SELECT COUNT(r) > 0
        FROM Race r
        WHERE r.roundId IN :roundIds
        AND r.raceId <> :raceId
        AND r.status <> :cancelledStatus
        AND r.startTime < :endTime
        AND r.endTime > :startTime
        """)
    boolean existsOverlappingRaceExcludingCurrent(
            @Param("roundIds") List<Integer> roundIds,
            @Param("raceId") Integer raceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("cancelledStatus") String cancelledStatus
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Race r where r.raceId = :raceId")
    Optional<Race> findByIdForUpdate(@Param("raceId") Integer raceId);
}
