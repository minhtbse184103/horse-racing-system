package com.example.backend.repository;


import com.example.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RaceRoundRepository extends JpaRepository<RaceRound, Integer> {
    List<RaceRound> findByRaceId(Integer raceId);
    long countByRaceId(Integer raceId);
    long countByRaceIdAndStatusNot(Integer raceId, String status);
    boolean existsByRaceIdAndRoundNumber(Integer raceId, Integer roundNumber);
    boolean existsByRaceIdAndRoundNumberAndStatusNot(
        Integer raceId,
        Integer roundNumber,
        String status
);
    boolean existsByRaceIdAndRoundNumberAndRoundIdNot(
        Integer raceId,
        Integer roundNumber,
        Integer roundId
);
    boolean existsByRaceIdAndRoundNumberAndStatusNotAndRoundIdNot(
        Integer raceId,
        Integer roundNumber,
        String status,
        Integer roundId
);
}
