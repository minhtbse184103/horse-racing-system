package com.example.backend.repository;

import com.example.backend.entity.Race;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RaceRepository extends JpaRepository<Race, Integer> {

    List<Race> findByTournamentIdOrderByRaceOrderAsc(Integer tournamentId);

    long countByTournamentId(Integer tournamentId);

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
        select coalesce(max(race.raceOrder), 0)
        from Race race
        where race.tournamentId = :tournamentId
        """)
    int findMaximumRaceOrder(
            @Param("tournamentId") Integer tournamentId
    );

}
