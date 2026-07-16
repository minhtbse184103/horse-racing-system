package com.example.backend.repository;

import com.example.backend.entity.FundTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FundTransactionRepository extends JpaRepository<FundTransaction, Long> {
    List<FundTransaction> findTop50ByOrderByCreatedAtDesc();
}
