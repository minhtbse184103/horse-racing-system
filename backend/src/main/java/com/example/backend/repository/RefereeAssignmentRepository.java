package com.example.backend.repository;

import com.example.backend.entity.RefereeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefereeAssignmentRepository
        extends JpaRepository<RefereeAssignment, Integer> {

    boolean existsByRaceId(Integer raceId);

    Optional<RefereeAssignment> findByRaceId(Integer raceId);

    List<RefereeAssignment> findByRefereeUserId(Integer refereeUserId);

    @Query("""
        SELECT COUNT(assignment) > 0
        FROM RefereeAssignment assignment
        JOIN Race race ON race.raceId = assignment.raceId
        WHERE assignment.refereeUserId = :refereeUserId
          AND assignment.status = 'Assigned'
          AND race.status <> 'Cancelled'
          AND race.startTime < :endTime
          AND race.endTime > :startTime
        """)
    boolean existsOverlappingAssignment(
            @Param("refereeUserId") Integer refereeUserId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
}