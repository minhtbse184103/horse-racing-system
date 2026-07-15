package com.example.backend.repository;

import com.example.backend.entity.BetEvent;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BetEventRepository extends JpaRepository<BetEvent, Integer> {

    boolean existsByRaceIdAndBetProductId(Integer raceId, Integer betProductId);

    List<BetEvent> findByStatusInOrderByOpenAtAsc(Collection<String> statuses);

    List<BetEvent> findByRaceIdOrderByOpenAtAsc(Integer raceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select event
            from BetEvent event
            where event.betEventId = :betEventId
            """)
    Optional<BetEvent> findByIdForUpdate(@Param("betEventId") Integer betEventId);
}
