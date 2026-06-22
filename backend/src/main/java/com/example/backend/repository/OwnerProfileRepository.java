package com.example.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.OwnerProfile;

@Repository
public interface OwnerProfileRepository extends JpaRepository<OwnerProfile, Integer> {
    Optional<OwnerProfile> findByApplicationId(Integer applicationId);
}
