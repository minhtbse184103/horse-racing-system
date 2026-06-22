package com.example.backend.repository;

import com.example.backend.entity.RacePrize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RacePrizeRepository
        extends JpaRepository<RacePrize, Integer> {

    List<RacePrize> findByRaceIdOrderByRankPositionAsc(Integer raceId);

    void deleteByRaceId(Integer raceId);
}
