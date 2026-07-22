package com.example.backend.repository;

import com.example.backend.entity.RaceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.List;
import java.util.Optional;
import java.util.Collection;

@Repository
public interface RaceEntryRepository
        extends JpaRepository<RaceEntry, Integer> {

    // FLOW: Admin Assigned RaceEntry Load
    // ORDER: 6B/6 - Repository returns only active ASSIGNED entries for the selected Race in startingStall order.
    // Returns active RaceEntry rows for one Race ordered by startingStall for official entry display.
    List<RaceEntry> findByRaceIdAndStatusOrderByStartingStallAsc(
            Integer raceId,
            String status
    );
    Optional<RaceEntry> findByRegistrationIdAndStatus(
            Integer registrationId,
            String status
    );
    List<RaceEntry> findByRegistrationIdInAndStatus(
            Collection<Integer> registrationIds,
            String status
    );
    boolean existsByRegistrationIdAndStatus(
            Integer registrationId,
            String status
    );
    // FLOW: Admin Assign RaceEntry
    // ORDER: 6A/8 - Repository counts active ASSIGNED entries for Race capacity validation.
    long countByRaceIdAndStatus(
            Integer raceId,
            String status
    );
    boolean existsByRaceId(Integer raceId);

    // FLOW: Admin Assign RaceEntry
    // ORDER: 6B/8 - Repository reads occupied ASSIGNED stalls for backend random startingStall selection.
    // Reads active occupied stalls for backend random startingStall selection.
    @Query("""
        select entry.startingStall
        from RaceEntry entry
        where entry.raceId = :raceId
          and entry.status = :status
        order by entry.startingStall asc
        """)
    List<Integer> findOccupiedStartingStalls(
            @Param("raceId") Integer raceId,
            @Param("status") String status
    );
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select entry
        from RaceEntry entry
        where entry.raceEntryId = :raceEntryId
        """)
    Optional<RaceEntry> findByIdForUpdate(
            @Param("raceEntryId") Integer raceEntryId
    );

    List<RaceEntry> findByRaceIdInAndStatus(
            List<Integer> raceIds,
            String status
    );

    interface OwnerRaceProjection {
        Integer getRaceEntryId();
        Integer getRaceId();
        Integer getTournamentId();
        String getTournamentName();
        String getRaceName();
        String getTrackName();
        String getTrackImageUrl();
        java.time.LocalDateTime getRaceStartTime();
        java.time.LocalDateTime getRaceEndTime();
        Integer getDistance();
        Integer getMaxRunners();
        Integer getRaceOrder();
        String getRaceStatus();
        Integer getStartingStall();
        String getRaceEntryStatus();
        Integer getRegistrationId();
        String getRegistrationNo();
        Integer getHorseId();
        String getHorseName();
        Integer getJockeyId();
        String getJockeyName();
    }

    @Query("""
        select entry.raceEntryId as raceEntryId,
               race.raceId as raceId,
               tournament.tournamentId as tournamentId,
               tournament.tournamentName as tournamentName,
               race.raceName as raceName,
               race.trackName as trackName,
               race.trackImageUrl as trackImageUrl,
               race.raceStartTime as raceStartTime,
               race.raceEndTime as raceEndTime,
               race.distance as distance,
               race.maxRunners as maxRunners,
               race.raceOrder as raceOrder,
               race.status as raceStatus,
               entry.startingStall as startingStall,
               entry.status as raceEntryStatus,
               registration.registrationId as registrationId,
               registration.registrationNo as registrationNo,
               horse.horseId as horseId,
               horse.horseName as horseName,
               jockey.userID as jockeyId,
               coalesce(jockeyProfile.fullName, jockey.username) as jockeyName
        from RaceEntry entry
        join Registration registration on registration.registrationId = entry.registrationId
        join Race race on race.raceId = entry.raceId
        join Tournament tournament on tournament.tournamentId = race.tournamentId
        join Horse horse on horse.horseId = registration.horseId
        join User jockey on jockey.userID = registration.jockeyId
        left join JockeyProfile jockeyProfile on jockeyProfile.jockeyId = jockey.userID
        where registration.ownerId = :ownerId
        order by race.raceStartTime desc, race.raceOrder asc
        """)
    List<OwnerRaceProjection> findOwnerRaces(
            @Param("ownerId") Integer ownerId
    );

    interface JockeyRaceProjection {
        Integer getRaceEntryId();
        Integer getRaceId();
        Integer getTournamentId();
        String getTournamentName();
        String getRaceName();
        String getTrackName();
        String getTrackImageUrl();
        java.time.LocalDateTime getRaceStartTime();
        java.time.LocalDateTime getRaceEndTime();
        Integer getDistance();
        Integer getMaxRunners();
        Integer getRaceOrder();
        String getRaceStatus();
        Integer getStartingStall();
        String getRaceEntryStatus();
        Integer getRegistrationId();
        String getRegistrationNo();
        Integer getHorseId();
        String getHorseName();
        Integer getOwnerId();
        String getOwnerName();
        Integer getJockeyId();
        String getJockeyName();
    }

    @Query("""
        select entry.raceEntryId as raceEntryId,
               race.raceId as raceId,
               tournament.tournamentId as tournamentId,
               tournament.tournamentName as tournamentName,
               race.raceName as raceName,
               race.trackName as trackName,
               race.trackImageUrl as trackImageUrl,
               race.raceStartTime as raceStartTime,
               race.raceEndTime as raceEndTime,
               race.distance as distance,
               race.maxRunners as maxRunners,
               race.raceOrder as raceOrder,
               race.status as raceStatus,
               entry.startingStall as startingStall,
               entry.status as raceEntryStatus,
               registration.registrationId as registrationId,
               registration.registrationNo as registrationNo,
               horse.horseId as horseId,
               horse.horseName as horseName,
               owner.userID as ownerId,
               owner.username as ownerName,
               jockey.userID as jockeyId,
               coalesce(jockeyProfile.fullName, jockey.username) as jockeyName
        from RaceEntry entry
        join Registration registration on registration.registrationId = entry.registrationId
        join Race race on race.raceId = entry.raceId
        join Tournament tournament on tournament.tournamentId = race.tournamentId
        join Horse horse on horse.horseId = registration.horseId
        join User owner on owner.userID = registration.ownerId
        join User jockey on jockey.userID = registration.jockeyId
        left join JockeyProfile jockeyProfile on jockeyProfile.jockeyId = jockey.userID
        where registration.jockeyId = :jockeyId
        order by race.raceStartTime desc, race.raceOrder asc
        """)
    List<JockeyRaceProjection> findJockeyRaces(
            @Param("jockeyId") Integer jockeyId
    );

    interface RaceEntryCountProjection {
        Integer getRaceId();
        long getEntryCount();
    }

    // FLOW: Admin Tournament Workspace Read
    // ORDER: 5D/7 - Repository counts active assigned entries for Race capacity indicators.
    // Purpose: count active ASSIGNED entries by Race for capacity indicators without loading full RaceEntry rows.
    @Query("""
        select entry.raceId as raceId, count(entry) as entryCount
        from RaceEntry entry
        where entry.raceId in :raceIds
          and entry.status = :status
        group by entry.raceId
        """)
    List<RaceEntryCountProjection> countAssignedEntriesByRaceIds(
            @Param("raceIds") Collection<Integer> raceIds,
            @Param("status") String status
    );
}
