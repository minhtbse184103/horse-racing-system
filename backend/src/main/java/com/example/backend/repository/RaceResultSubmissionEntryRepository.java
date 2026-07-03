package com.example.backend.repository;

import com.example.backend.entity.RaceResultSubmissionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceResultSubmissionEntryRepository
        extends JpaRepository<RaceResultSubmissionEntry, Integer> {

    List<RaceResultSubmissionEntry> findBySubmissionIdOrderByFinishPositionAsc(
            Integer submissionId
    );

    long countBySubmissionId(Integer submissionId);

    @Query("""
            select entry.submissionEntryId as submissionEntryId,
                   entry.raceEntryId as raceEntryId,
                   entry.startingStall as startingStall,
                   entry.finishPosition as finishPosition,
                   horse.horseName as horseName,
                   coalesce(ownerApplication.fullName, owner.username) as ownerName,
                   coalesce(jockeyProfile.fullName, jockey.username) as jockeyName,
                   entry.finishTime as finishTime
            from RaceResultSubmissionEntry entry
            join RaceEntry raceEntry
              on raceEntry.raceEntryId = entry.raceEntryId
            join Registration registration
              on registration.registrationId = raceEntry.registrationId
            join Horse horse
              on horse.horseId = registration.horseId
            join User owner
              on owner.userID = registration.ownerId
            left join OwnerApplication ownerApplication
              on ownerApplication.userId = owner.userID
            left join User jockey
              on jockey.userID = registration.jockeyId
            left join JockeyProfile jockeyProfile
              on jockeyProfile.jockeyId = jockey.userID
            where entry.submissionId = :submissionId
            order by entry.finishPosition asc
            """)
    List<RaceResultSubmissionEntryProjection> findEntryDetailsBySubmissionId(
            @Param("submissionId") Integer submissionId
    );

    interface RaceResultSubmissionEntryProjection {
        Integer getSubmissionEntryId();

        Integer getRaceEntryId();

        Integer getStartingStall();

        Integer getFinishPosition();

        String getHorseName();

        String getOwnerName();

        String getJockeyName();

        String getFinishTime();
    }
}
