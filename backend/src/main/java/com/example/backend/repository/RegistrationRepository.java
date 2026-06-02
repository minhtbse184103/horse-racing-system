package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Registration;
import com.example.backend.entity.Race;
import com.example.backend.entity.Horse;
import com.example.backend.entity.User;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Integer> {
    List<Registration> findByOwner(User owner);
    
    List<Registration> findByRace(Race race);
    
    Optional<Registration> findByRaceAndHorse(Race race, Horse horse);
    
    List<Registration> findByHorse(Horse horse);
    
    int countByRace(Race race);
}
