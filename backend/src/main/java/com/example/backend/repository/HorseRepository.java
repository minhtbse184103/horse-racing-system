package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Horse;

@Repository
public interface HorseRepository extends JpaRepository<Horse, Integer> {
    List<Horse> findByOwnerId(Integer ownerId);

    Optional<Horse> findByHorseIdAndOwnerId(Integer horseId, Integer ownerId);

    long countByOwnerId(Integer ownerId);
}
