package com.example.backend.repository;

import com.example.backend.entity.Tournament;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentRepository
        extends JpaRepository<Tournament, Integer> {

    List<Tournament> findAllByOrderByCreatedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select tournament
            from Tournament tournament
            where tournament.tournamentId = :tournamentId
            """)
    Optional<Tournament> findByIdForUpdate(
            @Param("tournamentId") Integer tournamentId
    );
}