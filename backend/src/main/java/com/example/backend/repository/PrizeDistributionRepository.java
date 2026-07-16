package com.example.backend.repository;

import com.example.backend.entity.PrizeDistribution;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

@Repository
// FLOW: Admin Approve Result
// ORDER: 7C/9 - Repository persists prize split records produced during Admin approval settlement.
// Persists prize split rows created by RacePrizeSettlementService after official result approval.
// FLOW: Prize Split Display
// ORDER: 5A/7 - Display query reads these stored split rows through RaceResultRepository.findPrizeResultsByRaceId.
// Result/prize reads join these rows through RaceResultRepository.findPrizeResultsByRaceId.
public interface PrizeDistributionRepository
        extends JpaRepository<PrizeDistribution, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select distribution from PrizeDistribution distribution where distribution.prizeDistributionId = :id")
    Optional<PrizeDistribution> findByIdForUpdate(@Param("id") Integer id);

    List<PrizeDistribution> findByStatusOrderByCreatedAtAsc(String status);

    List<PrizeDistribution> findByStatusInOrderByCreatedAtAsc(Collection<String> statuses);

    @Query("""
            select distribution from PrizeDistribution distribution
            where distribution.status in :statuses
              and (distribution.ownerId = :userId or distribution.jockeyId = :userId)
            order by distribution.createdAt asc
            """)
    List<PrizeDistribution> findPayableByUserId(
            @Param("userId") Integer userId,
            @Param("statuses") Collection<String> statuses
    );
}
