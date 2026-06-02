package com.example.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyProfile;

@Repository
public interface JockeyProfileRepository extends JpaRepository<JockeyProfile, Integer> {
    Optional<JockeyProfile> findByLicenseNo(String licenseNo);
}
