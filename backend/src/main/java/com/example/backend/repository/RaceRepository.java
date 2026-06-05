package com.example.backend.repository;


import com.example.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
public interface RaceRepository extends JpaRepository<Race, Integer> {

List<Race> findByTournamentId(Integer tournamentId);
List<Race> findByTournamentIdAndStatusNotOrderByScheduledTimeAscRaceIdAsc(
            Integer tournamentId,
            String status
    );
boolean existsByTournamentIdAndScheduledTimeAndStatusNot(
            Integer tournamentId,
            LocalDateTime scheduledTime,
            String status
    );
    boolean existsByTournamentIdAndScheduledTimeAndRaceIdNotAndStatusNot(
            Integer tournamentId,
            LocalDateTime scheduledTime,
            Integer raceId,
            String status
    );
}