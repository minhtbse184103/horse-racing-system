package com.example.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyInvitation;

@Repository
public interface JockeyInvitationRepository extends JpaRepository<JockeyInvitation, Integer> {
    List<JockeyInvitation> findByOwnerIdOrderByCreatedAtDesc(Integer ownerId);

    List<JockeyInvitation> findByJockeyIdOrderByCreatedAtDesc(Integer jockeyId);

    Optional<JockeyInvitation> findByInvitationIdAndOwnerId(Integer invitationId, Integer ownerId);

    Optional<JockeyInvitation> findByInvitationIdAndJockeyId(Integer invitationId, Integer jockeyId);

    boolean existsByRegistrationIdAndJockeyIdAndStatus(Integer registrationId, Integer jockeyId, String status);

    void deleteByRegistrationIdIn(Collection<Integer> registrationIds);
}
