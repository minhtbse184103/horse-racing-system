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

    // FLOW: Provisional Race Result Submission
    // ORDER: 9/10 - Review screens later read these provisional rows before Admin approval creates official results.
    // Loads provisional finish rows in race order for Referee/Admin review
    // before official RaceResult rows are created.
    List<RaceResultSubmissionEntry> findBySubmissionIdOrderByFinishPositionAsc(
            Integer submissionId
    );

    long countBySubmissionId(Integer submissionId);

    // FLOW: Referee Review Detail / Admin Result Review Detail
    // ORDER: 6/8 - Entry detail query enriches provisional rows with Horse, Owner, and Jockey display names.
    // Joins RaceEntry -> Registration -> Horse/Owner/Jockey names for the review detail table.
    @Query("""
            select entry.submissionEntryId as submissionEntryId,
                   entry.raceEntryId as raceEntryId,
                   entry.startingStall as startingStall,
                   entry.finishPosition as finishPosition,
                   horse.horseName as horseName,
                   owner.username as ownerName,
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
