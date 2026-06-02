package com.example.backend.repository;


import com.example.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceCategoryRepository extends JpaRepository<RaceCategory, Integer> {
}