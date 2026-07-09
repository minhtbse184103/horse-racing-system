package com.example.backend.repository;

import com.example.backend.entity.UserVerification;
import com.example.backend.enums.KycStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserVerificationRepository
        extends JpaRepository<UserVerification, Integer> {

    Optional<UserVerification> findByUserId(Integer userId);

    boolean existsByIdentityNumberAndUserIdNot(String identityNumber, Integer userId);

    List<UserVerification> findByStatusOrderBySubmittedAtAsc(KycStatus status);

    List<UserVerification> findAllByOrderBySubmittedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select verification
            from UserVerification verification
            where verification.verificationId = :verificationId
            """)
    Optional<UserVerification> findByIdForUpdate(
            @Param("verificationId") Integer verificationId
    );
}
