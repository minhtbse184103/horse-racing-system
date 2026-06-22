package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyVerification;

@Repository
public interface JockeyVerificationRepository extends JpaRepository<JockeyVerification, Integer> {

    // Lấy tất cả verification của một jockey, sắp xếp mới nhất lên trước.
    List<JockeyVerification> findByJockeyIdOrderByCreatedAtDesc(Integer jockeyId);

    // Lấy verification mới nhất của jockey.
    Optional<JockeyVerification> findFirstByJockeyIdOrderByCreatedAtDesc(Integer jockeyId);

    // Lấy tất cả verification đang PENDING để admin xét duyệt.
    List<JockeyVerification> findByVerificationStatusOrderBySubmittedAtAsc(String verificationStatus);

    // Kiểm tra jockey có verification đang PENDING không.
    boolean existsByJockeyIdAndVerificationStatus(Integer jockeyId, String verificationStatus);
}
