package com.example.backend.repository;


import com.example.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TournamentRepository extends JpaRepository<Tournament, Integer> {
}