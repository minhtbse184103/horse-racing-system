package com.example.backend.repository;

import com.example.backend.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository
        extends JpaRepository<WalletTransaction, Integer> {
    List<WalletTransaction> findAllByOrderByCreatedAtDesc();

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(Integer userId);

    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Integer walletId);

    List<WalletTransaction> findByWalletIdAndTypeOrderByCreatedAtDesc(Integer walletId, String type);
}
