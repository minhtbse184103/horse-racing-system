package com.example.backend.repository;

import com.example.backend.entity.UserVerification;
import com.example.backend.enums.KycStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserVerificationRepository extends JpaRepository<UserVerification, Integer> {
    Optional<UserVerification> findFirstByUserIdOrderByAttemptNumberDesc(Integer userId);

    default Optional<UserVerification> findByUserId(Integer userId) {
        return findFirstByUserIdOrderByAttemptNumberDesc(userId);
    }
    Optional<UserVerification> findFirstByUserIdAndStatusOrderByAttemptNumberDesc(Integer userId, KycStatus status);
    Optional<UserVerification> findByProviderSessionId(String providerSessionId);
    boolean existsByProviderSessionId(String providerSessionId);
    List<UserVerification> findByStatusOrderBySubmittedAtAsc(KycStatus status);
    List<UserVerification> findAllByOrderBySubmittedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from UserVerification v where v.providerSessionId = :sessionId")
    Optional<UserVerification> findByProviderSessionIdForUpdate(@Param("sessionId") String sessionId);

    @Query("select max(v.attemptNumber) from UserVerification v where v.userId = :userId")
    Integer findMaxAttemptNumber(@Param("userId") Integer userId);

    @Query("select v from UserVerification v where v.userId = :userId and v.status in :statuses order by v.attemptNumber desc")
    List<UserVerification> findActiveByUserId(@Param("userId") Integer userId,
                                               @Param("statuses") Collection<KycStatus> statuses);
}
