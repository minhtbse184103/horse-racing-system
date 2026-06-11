package com.example.backend.repository;

import com.example.backend.constant.EventStatus;
import com.example.backend.entity.Race;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;

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

    public long countDraftTournaments() {
        return countTournamentsByStatus(EventStatus.DRAFT);
    }

    public long countCancelledTournaments() {
        return countTournamentsByStatus(EventStatus.CANCELLED);
    }

    public long countRaces() {
        return count(Race.class);
    }

    public long countDraftRaces() {
        return countRacesByStatus(EventStatus.DRAFT);
    }

    public long countCancelledRaces() {
        return countRacesByStatus(EventStatus.CANCELLED);
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