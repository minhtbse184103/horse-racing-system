package com.example.backend.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.RaceResult;

@Repository
public interface RaceResultRepository extends JpaRepository<RaceResult, Integer> {
    boolean existsByRaceEntryIdIn(Collection<Integer> raceEntryIds);

    interface RaceResultCountProjection {
        Integer getRaceId();
        long getResultCount();
    }

    @Query("""
        select entry.raceId as raceId, count(result) as resultCount
        from RaceResult result
        join RaceEntry entry on result.raceEntryId = entry.raceEntryId
        where entry.raceId in :raceIds
        group by entry.raceId
        """)
    List<RaceResultCountProjection> countResultsByRaceIds(
            @Param("raceIds") Collection<Integer> raceIds
    );

    interface RaceResultPrizeProjection {
        Integer getResultId();
        Integer getRaceEntryId();
        Integer getStartingStall();
        Integer getFinishPosition();
        String getFinishTime();
        Integer getPoints();
        BigDecimal getPrizeMoney();
        LocalDateTime getRecordedAt();
        Integer getHorseId();
        String getHorseName();
        Integer getOwnerId();
        String getOwnerName();
        Integer getJockeyId();
        String getJockeyName();
        Integer getPrizeDistributionId();
        BigDecimal getTotalPrize();
        BigDecimal getOwnerAmount();
        BigDecimal getJockeyAmount();
        String getDistributionStatus();
    }

    @Query("""
        select result.resultId as resultId,
               entry.raceEntryId as raceEntryId,
               entry.startingStall as startingStall,
               result.finishPosition as finishPosition,
               result.finishTime as finishTime,
               result.points as points,
               result.prizeMoney as prizeMoney,
               result.recordedAt as recordedAt,
               horse.horseId as horseId,
               horse.horseName as horseName,
               owner.userID as ownerId,
               coalesce(ownerApplication.fullName, owner.username) as ownerName,
               jockey.userID as jockeyId,
               coalesce(jockeyProfile.fullName, jockey.username) as jockeyName,
               distribution.prizeDistributionId as prizeDistributionId,
               distribution.totalPrize as totalPrize,
               distribution.ownerAmount as ownerAmount,
               distribution.jockeyAmount as jockeyAmount,
               distribution.status as distributionStatus
        from RaceResult result
        join RaceEntry entry
          on entry.raceEntryId = result.raceEntryId
        join Registration registration
          on registration.registrationId = entry.registrationId
        join Horse horse
          on horse.horseId = registration.horseId
        join User owner
          on owner.userID = registration.ownerId
        join User jockey
          on jockey.userID = registration.jockeyId
        left join OwnerApplication ownerApplication
          on ownerApplication.userId = owner.userID
         and ownerApplication.status = 'APPROVED'
        left join JockeyProfile jockeyProfile
          on jockeyProfile.jockeyId = jockey.userID
        left join PrizeDistribution distribution
          on distribution.raceId = entry.raceId
         and distribution.raceEntryId = entry.raceEntryId
        where entry.raceId = :raceId
        order by result.finishPosition asc
        """)
    List<RaceResultPrizeProjection> findPrizeResultsByRaceId(
            @Param("raceId") Integer raceId
    );
}
