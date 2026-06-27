package com.example.backend.repository;

import com.example.backend.entity.PaymentTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentTransactionRepository
        extends JpaRepository<PaymentTransaction, Integer> {

    Optional<PaymentTransaction> findByTxnRef(String txnRef);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select paymentTransaction
            from PaymentTransaction paymentTransaction
            where paymentTransaction.txnRef = :txnRef
            """)
    Optional<PaymentTransaction> findByTxnRefForUpdate(
            @Param("txnRef") String txnRef
    );
}
