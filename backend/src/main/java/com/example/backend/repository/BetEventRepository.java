package com.example.backend.repository;

import com.example.backend.entity.BetEvent;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Modifying;
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
            where event.raceId = :raceId
              and event.status in :statuses
            order by event.openAt asc
            """)
    List<BetEvent> findByRaceIdAndStatusInForUpdate(
            @Param("raceId") Integer raceId,
            @Param("statuses") Collection<String> statuses
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select event
            from BetEvent event
            where event.betEventId = :betEventId
            """)
    Optional<BetEvent> findByIdForUpdate(@Param("betEventId") Integer betEventId);

    @Modifying
    @Query("""
            update BetEvent event
            set event.openAt = :openAt,
                event.closeAt = :closeAt,
                event.updatedAt = :updatedAt
            where event.raceId = :raceId
              and event.status <> :settledStatus
            """)
    int fastForwardCloseTimeByRaceId(
            @Param("raceId") Integer raceId,
            @Param("openAt") java.time.LocalDateTime openAt,
            @Param("closeAt") java.time.LocalDateTime closeAt,
            @Param("updatedAt") java.time.LocalDateTime updatedAt,
            @Param("settledStatus") String settledStatus
    );
}
