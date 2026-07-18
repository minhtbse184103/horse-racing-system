package com.example.backend.repository;

import com.example.backend.entity.BetTicket;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BetTicketRepository extends JpaRepository<BetTicket, Integer> {

    List<BetTicket> findByUserIdOrderByPlacedAtDesc(Integer userId);

    List<BetTicket> findByBetEventIdOrderByPlacedAtAsc(Integer betEventId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select ticket
            from BetTicket ticket
            where ticket.betTicketId = :betTicketId
            """)
    Optional<BetTicket> findByIdForUpdate(@Param("betTicketId") Integer betTicketId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select ticket
            from BetTicket ticket
            where ticket.betEventId = :betEventId
              and ticket.status = :status
            order by ticket.placedAt asc
            """)
    List<BetTicket> findPlacedByEventForUpdate(
            @Param("betEventId") Integer betEventId,
            @Param("status") String status
    );

    @Query("""
            select coalesce(sum(ticket.stake), 0)
            from BetTicket ticket
            join BetEvent event on event.betEventId = ticket.betEventId
            where ticket.userId = :userId
              and event.betProductId = :betProductId
              and ticket.placedAt >= :startAt
              and ticket.placedAt < :endAt
              and ticket.status in :statuses
            """)
    BigDecimal sumDailyStake(
            @Param("userId") Integer userId,
            @Param("betProductId") Integer betProductId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("statuses") Collection<String> statuses
    );

    @Query("""
            select coalesce(sum(ticket.stake), 0)
            from BetTicket ticket
            where ticket.betEventId = :betEventId
              and ticket.status in :statuses
            """)
    BigDecimal sumStakeByEvent(
            @Param("betEventId") Integer betEventId,
            @Param("statuses") Collection<String> statuses
    );

    @Query("""
            select coalesce(sum(ticket.stake), 0)
            from BetTicket ticket
            where ticket.betEventId = :betEventId
              and ticket.raceEntryId = :raceEntryId
              and ticket.status in :statuses
            """)
    BigDecimal sumStakeByEventAndRaceEntry(
            @Param("betEventId") Integer betEventId,
            @Param("raceEntryId") Integer raceEntryId,
            @Param("statuses") Collection<String> statuses
    );
}
