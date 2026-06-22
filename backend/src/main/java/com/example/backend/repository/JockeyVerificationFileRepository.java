package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyVerificationFile;

@Repository
public interface JockeyVerificationFileRepository extends JpaRepository<JockeyVerificationFile, Integer> {

    // Lấy tất cả file đính kèm của một verification.
    List<JockeyVerificationFile> findByVerificationId(Integer verificationId);

    // Xóa tất cả file đính kèm của một verification khi jockey resubmit.
    void deleteByVerificationId(Integer verificationId);
}
