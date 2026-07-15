package com.example.backend.repository;

import com.example.backend.entity.BetSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BetSettlementRepository extends JpaRepository<BetSettlement, Integer> {

    boolean existsByBetEventId(Integer betEventId);

    Optional<BetSettlement> findByBetEventId(Integer betEventId);
}
