package com.example.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyInvitation;

@Repository
public interface JockeyInvitationRepository extends JpaRepository<JockeyInvitation, Integer> {
    List<JockeyInvitation> findByOwnerIdOrderByCreatedAtDesc(Integer ownerId);

    List<JockeyInvitation> findByJockeyIdOrderByCreatedAtDesc(Integer jockeyId);

    Optional<JockeyInvitation> findByInvitationIdAndOwnerId(Integer invitationId, Integer ownerId);

    Optional<JockeyInvitation> findByInvitationIdAndJockeyId(Integer invitationId, Integer jockeyId);

    boolean existsByRegistrationIdAndJockeyIdAndStatus(Integer registrationId, Integer jockeyId, String status);

    boolean existsByHorseId(Integer horseId);

    boolean existsByTournamentIdAndHorseIdAndJockeyIdAndStatus(
            Integer tournamentId,
            Integer horseId,
            Integer jockeyId,
            String status);

    @Query("""
            select count(i) > 0
            from JockeyInvitation i
            where i.tournamentId = :tournamentId
              and i.jockeyId = :jockeyId
              and i.status = :invitationStatus
            """)
    boolean existsActiveInvitationForTournamentAndJockey(
            @Param("tournamentId") Integer tournamentId,
            @Param("jockeyId") Integer jockeyId,
            @Param("invitationStatus") String invitationStatus);

    void deleteByRegistrationIdIn(Collection<Integer> registrationIds);
}
