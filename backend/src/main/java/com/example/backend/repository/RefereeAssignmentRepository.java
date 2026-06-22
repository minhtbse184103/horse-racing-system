package com.example.backend.repository;

import com.example.backend.entity.RefereeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefereeAssignmentRepository
        extends JpaRepository<RefereeAssignment, Integer> {

    boolean existsByRaceId(Integer raceId);

    Optional<RefereeAssignment> findByRaceId(Integer raceId);

    @Query("""
            select count(assignment) > 0
            from RefereeAssignment assignment
            join Race race
              on race.raceId = assignment.raceId
            where assignment.refereeUserId = :refereeUserId
              and assignment.status = :assignedStatus
              and race.status <> :cancelledRaceStatus
              and race.raceId <> :excludedRaceId
              and race.raceStartTime < :targetEndTime
              and race.raceEndTime > :targetStartTime
            """)
    boolean existsOverlappingAssignment(
            @Param("refereeUserId") Integer refereeUserId,
            @Param("excludedRaceId") Integer excludedRaceId,
            @Param("targetStartTime") LocalDateTime targetStartTime,
            @Param("targetEndTime") LocalDateTime targetEndTime,
            @Param("assignedStatus") String assignedStatus,
            @Param("cancelledRaceStatus") String cancelledRaceStatus
    );
}