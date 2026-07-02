package com.example.backend.repository;

import com.example.backend.entity.RaceResultReviewAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceResultReviewActionRepository
        extends JpaRepository<RaceResultReviewAction, Integer> {

    List<RaceResultReviewAction> findBySubmissionIdOrderByCreatedAtAsc(
            Integer submissionId
    );
}
