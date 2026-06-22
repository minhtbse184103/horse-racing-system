package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Horse;

@Repository
public interface HorseRepository extends JpaRepository<Horse, Integer> {
    List<Horse> findByOwnerId(Integer ownerId);

    List<Horse> findByStatus(String status);

    Optional<Horse> findByHorseIdAndOwnerId(Integer horseId, Integer ownerId);

    long countByOwnerId(Integer ownerId);

    boolean existsByPassportNumberIgnoreCase(String passportNumber);

    boolean existsByPassportNumberIgnoreCaseAndHorseIdNot(String passportNumber, Integer horseId);

    boolean existsByHorseNameIgnoreCase(String horseName);

    boolean existsByHorseNameIgnoreCaseAndHorseIdNot(String horseName, Integer horseId);
}
