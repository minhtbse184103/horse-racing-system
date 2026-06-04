package com.example.backend.repository;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.RaceResult;

@Repository
public interface RaceResultRepository extends JpaRepository<RaceResult, Integer> {
    boolean existsByRegIdIn(Collection<Integer> regIds);
}
