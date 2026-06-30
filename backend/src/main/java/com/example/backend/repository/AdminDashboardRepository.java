package com.example.backend.repository;

import com.example.backend.constant.EventStatus;
import com.example.backend.dto.response.AdminOverviewResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import java.util.Collection;
import java.util.List;

@Repository
public class AdminDashboardRepository {
    private final EntityManager entityManager;

    public AdminDashboardRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public long countUsers() {
        return count(User.class);
    }

    public long countUsersByRole(String roleName) {
        return entityManager.createQuery("""
                SELECT COUNT(u)
                FROM User u
                WHERE u.role.roleName = :roleName
                """, Long.class)
                .setParameter("roleName", roleName)
                .getSingleResult();
    }

    public long countUsersByStatus(String status) {
        return entityManager.createQuery("""
                SELECT COUNT(u)
                FROM User u
                WHERE u.status = :status
                """, Long.class)
                .setParameter("status", status)
                .getSingleResult();
    }

    public long countHorses() {
        return entityManager.createQuery("""
                SELECT COUNT(h)
                FROM Horse h
                """, Long.class)
                .getSingleResult();
    }

    public long countTournaments() {
        return count(Tournament.class);
    }

    public long countOpenRegistrationTournaments() {
        return countTournamentsByStatus(EventStatus.OPEN_FOR_REGISTRATION);
    }

    public long countCancelledTournaments() {
        return countTournamentsByStatus(EventStatus.CANCELLED);
    }

    public long countRaces() {
        return count(Race.class);
    }

    public long countOpenRegistrationRaces() {
        return countRacesByStatus(EventStatus.OPEN_FOR_REGISTRATION);
    }

    public long countCancelledRaces() {
        return countRacesByStatus(EventStatus.CANCELLED);
    }

    public long countPendingRegistrations() {
        return countRegistrationsByApprovalStatus("PENDING");
    }

    public long countApprovedRegistrations() {
        return countRegistrationsByApprovalStatus("APPROVED");
    }

    public long countPendingHorses() {
        return entityManager.createQuery("""
                SELECT COUNT(horse)
                FROM Horse horse
                WHERE horse.status = :status
                """, Long.class)
                .setParameter("status", "PENDING")
                .getSingleResult();
    }

    public long countJockeyReviewProfiles() {
        return entityManager.createQuery("""
                SELECT COUNT(verification)
                FROM JockeyVerification verification
                WHERE verification.verificationStatus IN :statuses
                """, Long.class)
                .setParameter("statuses", List.of("PENDING", "APPROVED"))
                .getSingleResult();
    }

    public long countPendingOwnerApplications() {
        return entityManager.createQuery("""
                SELECT COUNT(application)
                FROM OwnerApplication application
                WHERE application.status = :status
                """, Long.class)
                .setParameter("status", "PENDING")
                .getSingleResult();
    }

    public long countRaceEntryAssignmentQueue() {
        return entityManager.createQuery("""
                SELECT COUNT(registration)
                FROM Registration registration
                WHERE registration.approvalStatus = :approvalStatus
                  AND registration.paymentStatus = :paymentStatus
                  AND NOT EXISTS (
                        SELECT entry
                        FROM RaceEntry entry
                        WHERE entry.registrationId = registration.registrationId
                          AND entry.status = :entryStatus
                  )
                """, Long.class)
                .setParameter("approvalStatus", "APPROVED")
                .setParameter("paymentStatus", "PAID")
                .setParameter("entryStatus", "ASSIGNED")
                .getSingleResult();
    }

    public long countRefereeAssignments() {
        return entityManager.createQuery("""
                SELECT COUNT(assignment)
                FROM RefereeAssignment assignment
                """, Long.class)
                .getSingleResult();
    }

    public List<AdminOverviewResponse.TournamentOverviewItem>
    findUpcomingTournamentOverview(int limit) {
        return entityManager.createQuery("""
                SELECT tournament
                FROM Tournament tournament
                WHERE tournament.status <> :cancelledStatus
                ORDER BY tournament.startDate ASC
                """, Tournament.class)
                .setParameter("cancelledStatus", EventStatus.CANCELLED)
                .setMaxResults(limit)
                .getResultList()
                .stream()
                .map(tournament -> AdminOverviewResponse
                        .TournamentOverviewItem
                        .builder()
                        .tournamentId(tournament.getTournamentId())
                        .tournamentName(tournament.getTournamentName())
                        .venue(tournament.getVenue())
                        .startDate(tournament.getStartDate())
                        .status(tournament.getStatus())
                        .build())
                .toList();
    }

    public List<AdminOverviewResponse.TournamentStatusCount>
    countTournamentsByStatuses(Collection<String> statuses) {
        return statuses.stream()
                .map(status -> AdminOverviewResponse.TournamentStatusCount
                        .builder()
                        .status(status)
                        .count(countTournamentsByStatus(status))
                        .build())
                .toList();
    }

    private long countRegistrationsByApprovalStatus(String approvalStatus) {
        return entityManager.createQuery("""
                SELECT COUNT(registration)
                FROM Registration registration
                WHERE registration.approvalStatus = :approvalStatus
                """, Long.class)
                .setParameter("approvalStatus", approvalStatus)
                .getSingleResult();
    }

    private long countTournamentsByStatus(String status) {
        return entityManager.createQuery("""
                SELECT COUNT(t)
                FROM Tournament t
                WHERE t.status = :status
                """, Long.class)
                .setParameter("status", status)
                .getSingleResult();
    }

    private long countRacesByStatus(String status) {
        return entityManager.createQuery("""
                SELECT COUNT(r)
                FROM Race r
                WHERE r.status = :status
                """, Long.class)
                .setParameter("status", status)
                .getSingleResult();
    }

    private <T> long count(Class<T> entityClass) {
        return entityManager.createQuery(
                        "SELECT COUNT(e) FROM " + entityClass.getSimpleName() + " e",
                        Long.class
                )
                .getSingleResult();
    }
}
