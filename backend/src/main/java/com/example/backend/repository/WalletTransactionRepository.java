package com.example.backend.repository;

import com.example.backend.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletTransactionRepository
        extends JpaRepository<WalletTransaction, Integer> {
}
