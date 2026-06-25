package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.OwnerApplication;

@Repository
public interface OwnerApplicationRepository extends JpaRepository<OwnerApplication, Integer> {
    Optional<OwnerApplication> findFirstByUserIdOrderByApplicationIdDesc(Integer userId);

    boolean existsByUserIdAndStatus(Integer userId, String status);

    List<OwnerApplication> findByStatusOrderBySubmittedAtDesc(String status);

    List<OwnerApplication> findAllByOrderBySubmittedAtDesc();
}
