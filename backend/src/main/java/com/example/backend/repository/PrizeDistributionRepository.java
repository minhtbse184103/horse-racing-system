package com.example.backend.repository;

import com.example.backend.entity.PrizeDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PrizeDistributionRepository
        extends JpaRepository<PrizeDistribution, Integer> {
}
