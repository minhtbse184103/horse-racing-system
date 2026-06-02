package com.example.backend.repository;


import com.example.backend.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RaceRepository extends JpaRepository<Race, Integer> {

List<Race> findByTournamentId(Integer tournamentId);
}