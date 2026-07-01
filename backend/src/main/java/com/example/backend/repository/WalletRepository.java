package com.example.backend.repository;

import com.example.backend.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Integer> {

    Optional<Wallet> findByUserId(Integer userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select wallet
            from Wallet wallet
            where wallet.walletId = :walletId
            """)
    Optional<Wallet> findByWalletIdForUpdate(@Param("walletId") Integer walletId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select wallet
            from Wallet wallet
            where wallet.userId = :userId
            """)
    Optional<Wallet> findByUserIdForUpdate(@Param("userId") Integer userId);
}
