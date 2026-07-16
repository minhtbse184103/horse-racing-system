package com.example.backend.repository;

import com.example.backend.entity.SystemFund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface SystemFundRepository extends JpaRepository<SystemFund, Integer> {

    @Modifying
    @Query(value = """
            INSERT INTO SystemFund
                (systemFundID, balance, bettingFeeRevenue, createdAt, updatedAt)
            VALUES (1, :amount, :amount, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                balance = balance + VALUES(balance),
                bettingFeeRevenue = bettingFeeRevenue + VALUES(bettingFeeRevenue),
                updatedAt = NOW()
            """, nativeQuery = true)
    void creditBettingFee(@Param("amount") BigDecimal amount);
}
