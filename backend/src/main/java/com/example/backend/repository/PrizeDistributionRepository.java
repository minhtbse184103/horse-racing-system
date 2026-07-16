package com.example.backend.repository;

import com.example.backend.entity.PrizeDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
// FLOW: Admin Approve Result
// ORDER: 7C/9 - Repository persists prize split records produced during Admin approval settlement.
// Persists prize split rows created by RacePrizeSettlementService after official result approval.
// FLOW: Prize Split Display
// ORDER: 5A/7 - Display query reads these stored split rows through RaceResultRepository.findPrizeResultsByRaceId.
// Result/prize reads join these rows through RaceResultRepository.findPrizeResultsByRaceId.
public interface PrizeDistributionRepository
        extends JpaRepository<PrizeDistribution, Integer> {
}
