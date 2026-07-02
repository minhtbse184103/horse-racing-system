package com.example.backend.repository;

import com.example.backend.entity.RaceResultSubmissionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceResultSubmissionEntryRepository
        extends JpaRepository<RaceResultSubmissionEntry, Integer> {

    List<RaceResultSubmissionEntry> findBySubmissionIdOrderByFinishPositionAsc(
            Integer submissionId
    );
}
