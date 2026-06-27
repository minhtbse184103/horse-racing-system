package com.example.backend.repository;

import com.example.backend.entity.Registration;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository
        extends JpaRepository<Registration, Integer> {

    boolean existsByTournamentId(Integer tournamentId);
    long countByTournamentId(Integer tournamentId);
    List<Registration> findByApprovalStatusOrderBySubmittedAtAsc(
            String approvalStatus
    );

    List<Registration> findByApprovalStatusInOrderByReviewedAtDesc(
            Collection<String> approvalStatuses
    );

    long countByTournamentIdAndApprovalStatusIn(
            Integer tournamentId,
            Collection<String> approvalStatuses
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select registration
            from Registration registration
            where registration.registrationId = :registrationId
            """)
    Optional<Registration> findByIdForUpdate(
            @Param("registrationId") Integer registrationId
    );

    @Query("""
            select count(registration) > 0
            from Registration registration
            where registration.tournamentId = :tournamentId
              and registration.horseId = :horseId
              and registration.approvalStatus in :activeStatuses
              and (
                    :excludedRegistrationId is null
                    or registration.registrationId <> :excludedRegistrationId
                  )
            """)
    boolean existsActiveRegistration(
            @Param("tournamentId") Integer tournamentId,
            @Param("horseId") Integer horseId,
            @Param("activeStatuses") Collection<String> activeStatuses,
            @Param("excludedRegistrationId") Integer excludedRegistrationId
    );

    @Query("""
        select registration
        from Registration registration
        where registration.approvalStatus = :approvedStatus
          and registration.paymentStatus = :paidStatus
          and not exists (
                select entry
                from RaceEntry entry
                where entry.registrationId = registration.registrationId
                  and entry.status = :activeStatus
          )
        order by registration.reviewedAt asc
        """)
    List<Registration> findApprovedAndUnassigned(
            @Param("approvedStatus") String approvedStatus,
            @Param("paidStatus") String paidStatus,
            @Param("activeStatus") String activeStatus
    );
    @Query("""
        select registration
        from Registration registration
        where registration.tournamentId = :tournamentId
          and registration.approvalStatus = :approvedStatus
          and registration.paymentStatus = :paidStatus
          and not exists (
                select entry
                from RaceEntry entry
                where entry.registrationId = registration.registrationId
                  and entry.status = :activeStatus
          )
        order by registration.reviewedAt asc
        """)
    List<Registration> findApprovedAndUnassignedByTournament(
            @Param("tournamentId") Integer tournamentId,
            @Param("approvedStatus") String approvedStatus,
            @Param("paidStatus") String paidStatus,
            @Param("activeStatus") String activeStatus
    );
    List<Registration> findAllByOrderBySubmittedAtDesc();

    List<Registration> findByApprovalStatusOrderBySubmittedAtDesc(
            String approvalStatus
    );

    /*
     * Temporary compatibility queries for legacy Owner/Jockey services.
     * New Admin flow must use approvalStatus-based repository methods.
     */

    interface TournamentRegistrationCountProjection {
        Integer getTournamentId();
        long getRegistrationCount();
    }

    interface TournamentApprovedRegistrationCountProjection {
        Integer getTournamentId();
        long getApprovedRegistrationCount();
    }

    @Query("""
        select registration.tournamentId as tournamentId,
               count(registration) as registrationCount
        from Registration registration
        where registration.tournamentId in :tournamentIds
        group by registration.tournamentId
        """)
    List<TournamentRegistrationCountProjection> countRegistrationsByTournamentIds(
            @Param("tournamentIds") Collection<Integer> tournamentIds
    );

    @Query("""
        select registration.tournamentId as tournamentId,
               count(registration) as approvedRegistrationCount
        from Registration registration
        where registration.tournamentId in :tournamentIds
          and registration.approvalStatus in :approvalStatuses
        group by registration.tournamentId
        """)
    List<TournamentApprovedRegistrationCountProjection> countApprovedRegistrationsByTournamentIds(
            @Param("tournamentIds") Collection<Integer> tournamentIds,
            @Param("approvalStatuses") Collection<String> approvalStatuses
    );

    boolean existsByHorseId(Integer horseId);

    Optional<Registration> findByTournamentIdAndHorseId(
            Integer tournamentId,
            Integer horseId
    );

    long countByOwnerId(Integer ownerId);

    @Query("""
        select count(distinct registration.horseId)
        from Registration registration
        where registration.ownerId = :ownerId
        """)
    long countRegisteredHorsesByOwnerId(
            @Param("ownerId") Integer ownerId
    );

    @Query("""
        select registration.registrationId
        from Registration registration
        where registration.horseId = :horseId
        """)
    List<Integer> findRegistrationIdsByHorseId(
            @Param("horseId") Integer horseId
    );

    @Query("""
        select count(registration)
        from Registration registration
        where registration.registrationId in :registrationIds
          and registration.approvalStatus in :statuses
        """)
    long countByRegistrationIdInAndStatusIn(
            @Param("registrationIds")
            Collection<Integer> registrationIds,
            @Param("statuses")
            Collection<String> statuses
    );

    @Query("""
        select count(registration)
        from Registration registration
        where registration.tournamentId = :tournamentId
          and registration.approvalStatus in :statuses
        """)
    long countByTournamentIdAndStatusIn(
            @Param("tournamentId") Integer tournamentId,
            @Param("statuses") Collection<String> statuses
    );

    @Query("""
        select count(registration)
        from Registration registration
        where registration.tournamentId = :tournamentId
          and registration.ownerId = :ownerId
          and registration.approvalStatus in :statuses
          and (
                :excludedRegistrationId is null
                or registration.registrationId
                    <> :excludedRegistrationId
              )
        """)
    long countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
            @Param("tournamentId") Integer tournamentId,
            @Param("ownerId") Integer ownerId,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId")
            Integer excludedRegistrationId
    );

    @Query("""
        select count(registration)
        from Registration registration
        where registration.tournamentId = :tournamentId
          and registration.horseId = :horseId
          and registration.approvalStatus in :statuses
          and (
                :excludedRegistrationId is null
                or registration.registrationId
                    <> :excludedRegistrationId
              )
        """)
    long countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
            @Param("tournamentId") Integer tournamentId,
            @Param("horseId") Integer horseId,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId")
            Integer excludedRegistrationId
    );

    @Query("""
        select count(registration)
        from Registration registration
        where registration.tournamentId = :tournamentId
          and registration.jockeyId = :jockeyId
          and registration.approvalStatus in :statuses
          and (
                :excludedRegistrationId is null
                or registration.registrationId
                    <> :excludedRegistrationId
              )
        """)
    long countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
            @Param("tournamentId") Integer tournamentId,
            @Param("jockeyId") Integer jockeyId,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId")
            Integer excludedRegistrationId
    );

    @Query("""
        select count(registration)
        from Registration registration
        join Tournament tournament
          on tournament.tournamentId = registration.tournamentId
        where registration.jockeyId = :jockeyId
          and registration.approvalStatus in :statuses
          and (
                :excludedRegistrationId is null
                or registration.registrationId
                    <> :excludedRegistrationId
              )
          and tournament.startDate <= :endDate
          and tournament.endDate >= :startDate
        """)
    long countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
            @Param("jockeyId") Integer jockeyId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId")
            Integer excludedRegistrationId
    );

    @Query("""
        select count(registration)
        from Registration registration
        join Tournament tournament
          on tournament.tournamentId = registration.tournamentId
        where registration.horseId = :horseId
          and registration.jockeyId = :jockeyId
          and registration.approvalStatus in :statuses
          and (
                :excludedRegistrationId is null
                or registration.registrationId
                    <> :excludedRegistrationId
              )
          and tournament.startDate <= :endDate
          and tournament.endDate >= :startDate
        """)
    long countByOverlappingTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
            @Param("horseId") Integer horseId,
            @Param("jockeyId") Integer jockeyId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate,
            @Param("statuses") Collection<String> statuses,
            @Param("excludedRegistrationId")
            Integer excludedRegistrationId
    );
}
