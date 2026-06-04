package com.example.backend.repository;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyInvitation;

@Repository
public interface JockeyInvitationRepository extends JpaRepository<JockeyInvitation, Integer> {
    void deleteByRegIdIn(Collection<Integer> regIds);
}
