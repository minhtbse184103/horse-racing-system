package com.example.backend.repository;

import com.example.backend.entity.JockeyPerformanceSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JockeyPerformanceSummaryRepository
        extends JpaRepository<JockeyPerformanceSummary, Integer> {
}
