package com.example.backend.repository;

import com.example.backend.entity.HorsePerformanceSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HorsePerformanceSummaryRepository
        extends JpaRepository<HorsePerformanceSummary, Integer> {
}
