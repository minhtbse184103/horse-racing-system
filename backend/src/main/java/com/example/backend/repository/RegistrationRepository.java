package com.example.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Registration;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Integer> {
    List<Registration> findByHorseId(Integer horseId);

    Optional<Registration> findByTournamentIdAndHorseId(Integer tournamentId, Integer horseId);

    List<Registration> findByOwnerIdOrderByCreatedAtDesc(Integer ownerId);

    long countByOwnerId(Integer ownerId);

    long countByTournamentIdAndStatusIn(Integer tournamentId, Collection<String> statuses);

    void deleteByHorseId(Integer horseId);

    @Query("select count(distinct r.horseId) from Registration r where r.ownerId = :ownerId")
    long countRegisteredHorsesByOwnerId(@Param("ownerId") Integer ownerId);

    @Query("select r.registrationId from Registration r where r.horseId = :horseId")
    List<Integer> findRegistrationIdsByHorseId(@Param("horseId") Integer horseId);

    @Query("select count(r) from Registration r where r.registrationId in :registrationIds and r.status in :statuses")
    long countByRegistrationIdInAndStatusIn(@Param("registrationIds") Collection<Integer> registrationIds,
                                            @Param("statuses") Collection<String> statuses);
}
