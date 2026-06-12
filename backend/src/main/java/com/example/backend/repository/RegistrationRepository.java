package com.example.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Registration;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Integer> {
    List<Registration> findByHorseId(Integer horseId);

    boolean existsByHorseId(Integer horseId);

    List<Registration> findByStatusOrderByUpdatedAtAsc(String status);

    List<Registration> findByStatusInOrderByUpdatedAtDesc(
            Collection<String> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Registration r where r.registrationId = :registrationId")
    Optional<Registration> findByIdForUpdate(@Param("registrationId") Integer registrationId);

    Optional<Registration> findByTournamentIdAndHorseId(Integer tournamentId, Integer horseId);

    List<Registration> findByOwnerIdOrderByCreatedAtDesc(Integer ownerId);

    long countByOwnerId(Integer ownerId);

    long countByTournamentIdAndStatusIn(Integer tournamentId, Collection<String> statuses);

    @Query("""
            select count(r)
            from Registration r
            where r.tournamentId = :tournamentId
              and r.ownerId = :ownerId
              and r.status in :statuses
              and (:excludedRegistrationId is null or r.registrationId <> :excludedRegistrationId)
            """)
    long countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
            @Param("tournamentId") Integer tournamentId,
            @Param("ownerId") Integer ownerId,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId") Integer excludedRegistrationId);

    void deleteByHorseId(Integer horseId);

    @Query("select count(distinct r.horseId) from Registration r where r.ownerId = :ownerId")
    long countRegisteredHorsesByOwnerId(@Param("ownerId") Integer ownerId);

    @Query("select r.registrationId from Registration r where r.horseId = :horseId")
    List<Integer> findRegistrationIdsByHorseId(@Param("horseId") Integer horseId);

    @Query("select count(r) from Registration r where r.registrationId in :registrationIds and r.status in :statuses")
    long countByRegistrationIdInAndStatusIn(@Param("registrationIds") Collection<Integer> registrationIds,
                                            @Param("statuses") Collection<String> statuses);

    @Query("""
            select count(r)
            from Registration r
            where r.tournamentId = :tournamentId
              and r.jockeyId = :jockeyId
              and r.status in :statuses
              and (:excludedRegistrationId is null or r.registrationId <> :excludedRegistrationId)
            """)
    long countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
            @Param("tournamentId") Integer tournamentId,
            @Param("jockeyId") Integer jockeyId,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId") Integer excludedRegistrationId);

    @Query("""
            select count(r)
            from Registration r
            where r.tournamentId = :tournamentId
              and r.horseId = :horseId
              and r.status in :statuses
              and r.registrationId <> :excludedRegistrationId
            """)
    long countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
            @Param("tournamentId") Integer tournamentId,
            @Param("horseId") Integer horseId,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId") Integer excludedRegistrationId);

    @Query("""
            select count(r)
            from Registration r
            join Tournament t on t.tournamentId = r.tournamentId
            where r.jockeyId = :jockeyId
              and r.status in :statuses
              and (:excludedRegistrationId is null or r.registrationId <> :excludedRegistrationId)
              and t.startDate <= :endDate
              and t.endDate >= :startDate
            """)
    long countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
            @Param("jockeyId") Integer jockeyId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId") Integer excludedRegistrationId);

    @Query("""
            select count(r)
            from Registration r
            join Tournament t on t.tournamentId = r.tournamentId
            where r.horseId = :horseId
              and r.jockeyId = :jockeyId
              and r.status in :statuses
              and (:excludedRegistrationId is null or r.registrationId <> :excludedRegistrationId)
              and t.startDate <= :endDate
              and t.endDate >= :startDate
            """)
    long countByOverlappingTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
            @Param("horseId") Integer horseId,
            @Param("jockeyId") Integer jockeyId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId") Integer excludedRegistrationId);

    @Query("""
        select registration
        from Registration registration
        where registration.status = :confirmedStatus
          and exists (
              select qualifiedRound
              from TournamentRound qualifiedRound
              where qualifiedRound.tournamentId = registration.tournamentId
                and qualifiedRound.roundOrder = 1
          )
          and not exists (
              select entry
              from RaceEntry entry
              join Race race on race.raceId = entry.raceId
              join TournamentRound round on round.roundId = race.roundId
              where entry.registrationId = registration.registrationId
                and round.tournamentId = registration.tournamentId
                and round.roundOrder = 1
                and entry.status <> :withdrawnStatus
          )
        order by registration.updatedAt asc
        """)
    List<Registration> findQualifiedAssignmentQueue(
            @Param("confirmedStatus") String confirmedStatus,
            @Param("withdrawnStatus") String withdrawnStatus);

    @Query("""
        select registration
        from Registration registration
        where registration.status = :confirmedStatus
          and registration.tournamentId = :tournamentId
          and not exists (
              select entry
              from RaceEntry entry
              join Race race on race.raceId = entry.raceId
              where entry.registrationId = registration.registrationId
                and race.roundId = :roundId
                and entry.status <> :withdrawnStatus
          )
        order by registration.updatedAt asc
        """)
    List<Registration> findUnassignedByRound(
            @Param("tournamentId") Integer tournamentId,
            @Param("roundId") Integer roundId,
            @Param("confirmedStatus") String confirmedStatus,
            @Param("withdrawnStatus") String withdrawnStatus);
}
