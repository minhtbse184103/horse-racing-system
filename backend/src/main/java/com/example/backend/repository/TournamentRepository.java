package com.example.backend.repository;


import com.example.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface TournamentRepository extends JpaRepository<Tournament, Integer> {
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
