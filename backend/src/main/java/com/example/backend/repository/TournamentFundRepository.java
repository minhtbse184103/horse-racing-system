package com.example.backend.repository;

import com.example.backend.entity.TournamentFund;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface TournamentFundRepository extends JpaRepository<TournamentFund, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select fund from TournamentFund fund where fund.tournamentId = :tournamentId")
    Optional<TournamentFund> findByTournamentIdForUpdate(@Param("tournamentId") Integer tournamentId);

    @Modifying
    @Query(value = """
            INSERT INTO TournamentFund
                (tournamentID, collectedAmount, paidPrizeAmount, availableBalance, createdAt, updatedAt)
            VALUES (:tournamentId, :amount, 0, :amount, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                collectedAmount = collectedAmount + VALUES(collectedAmount),
                availableBalance = availableBalance + VALUES(availableBalance),
                updatedAt = NOW()
            """, nativeQuery = true)
    void creditRegistrationFee(
            @Param("tournamentId") Integer tournamentId,
            @Param("amount") BigDecimal amount
    );

    @Modifying
    @Query(value = """
            UPDATE TournamentFund
            SET collectedAmount = collectedAmount - :amount,
                availableBalance = availableBalance - :amount,
                updatedAt = NOW()
            WHERE tournamentID = :tournamentId
              AND collectedAmount >= :amount
              AND availableBalance >= :amount
            """, nativeQuery = true)
    int debitRegistrationRefund(
            @Param("tournamentId") Integer tournamentId,
            @Param("amount") BigDecimal amount
    );
}
