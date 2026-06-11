package com.example.backend.repository;


import com.example.backend.entity.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface TournamentRepository extends JpaRepository<Tournament, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tournament t where t.tournamentId = :tournamentId")
    Optional<Tournament> findByIdForUpdate(@Param("tournamentId") Integer tournamentId);

    boolean existsByLocationIgnoreCaseAndStartDateAndEndDateAndStatusNot(
            String location,
            LocalDate startDate,
            LocalDate endDate,
            String status
    );

    boolean existsByLocationIgnoreCaseAndStartDateAndEndDateAndStatusNotAndTournamentIdNot(
            String location,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            Integer tournamentId
    );
}
