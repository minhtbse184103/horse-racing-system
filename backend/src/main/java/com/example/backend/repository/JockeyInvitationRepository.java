package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;

@Repository
public interface JockeyInvitationRepository extends JpaRepository<JockeyInvitation, Integer> {
    Optional<JockeyInvitation> findByRegistration(Registration registration);
    
    List<JockeyInvitation> findByJockeyAndStatus(User jockey, String status);
}
