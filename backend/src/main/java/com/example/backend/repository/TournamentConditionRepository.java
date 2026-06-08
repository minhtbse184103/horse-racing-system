package com.example.backend.repository;

import com.example.backend.entity.TournamentCondition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TournamentConditionRepository
        extends JpaRepository<TournamentCondition, Integer> {
}