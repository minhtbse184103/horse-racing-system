package com.example.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.Registration;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Integer> {
    List<Registration> findByHorseId(Integer horseId);

    long countByOwnerId(Integer ownerId);

    void deleteByHorseId(Integer horseId);

    @Query("select count(distinct r.horseId) from Registration r where r.ownerId = :ownerId")
    long countRegisteredHorsesByOwnerId(@Param("ownerId") Integer ownerId);

    @Query("select r.regId from Registration r where r.horseId = :horseId")
    List<Integer> findRegIdsByHorseId(@Param("horseId") Integer horseId);

    @Query("select count(r) from Registration r where r.regId in :regIds and r.status in :statuses")
    long countByRegIdInAndStatusIn(@Param("regIds") Collection<Integer> regIds,
                                   @Param("statuses") Collection<String> statuses);
}
