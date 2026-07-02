package com.example.backend.repository;

import com.example.backend.entity.RaceResultSubmission;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RaceResultSubmissionRepository
        extends JpaRepository<RaceResultSubmission, Integer> {

    boolean existsByRaceId(Integer raceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select submission
            from RaceResultSubmission submission
            where submission.submissionId = :submissionId
            """)
    Optional<RaceResultSubmission> findByIdForUpdate(
            @Param("submissionId") Integer submissionId
    );

    @Query("""
            select submission
            from RaceResultSubmission submission
            join RefereeAssignment assignment
              on assignment.raceId = submission.raceId
            where assignment.refereeUserId = :refereeUserId
              and assignment.status = :assignedStatus
              and submission.status = :submissionStatus
            order by submission.submittedAt asc
            """)
    List<RaceResultSubmission> findPendingForReferee(
            @Param("refereeUserId") Integer refereeUserId,
            @Param("assignedStatus") String assignedStatus,
            @Param("submissionStatus") String submissionStatus
    );

    @Query("""
            select submission
            from RaceResultSubmission submission
            where submission.status in :statuses
            order by submission.refereeReviewedAt asc,
                     submission.submittedAt asc
            """)
    List<RaceResultSubmission> findAdminReviewQueue(
            @Param("statuses") List<String> statuses
    );
}
