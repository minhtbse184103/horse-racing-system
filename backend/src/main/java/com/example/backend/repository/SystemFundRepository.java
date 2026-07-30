package com.example.backend.repository;

import com.example.backend.entity.SystemFund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface SystemFundRepository extends JpaRepository<SystemFund, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select fund from SystemFund fund where fund.systemFundId = :fundId")
    Optional<SystemFund> findByIdForUpdate(@Param("fundId") Integer fundId);

    @Modifying
    @Query(value = """
            INSERT INTO SystemFund
                (systemFundID, balance, bettingFeeRevenue, minusPoolSubsidyPaid, createdAt, updatedAt)
            VALUES (1, :amount, :amount, 0, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                balance = balance + VALUES(balance),
                bettingFeeRevenue = bettingFeeRevenue + VALUES(bettingFeeRevenue),
                updatedAt = NOW()
            """, nativeQuery = true)
    void creditBettingFee(@Param("amount") BigDecimal amount);
}
