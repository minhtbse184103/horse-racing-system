package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Horse;
import com.example.backend.entity.User;

@Repository
public interface HorseRepository extends JpaRepository<Horse, Integer> {
    List<Horse> findByOwner(User owner);
    
    Optional<Horse> findByHorseIDAndOwner(Integer horseID, User owner);
}
