package com.example.backend.repository;

import com.example.backend.entity.RaceResultReviewAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RaceResultReviewActionRepository
        extends JpaRepository<RaceResultReviewAction, Integer> {

    // FLOW: Referee Review Detail / Admin Result Review Detail
    // ORDER: 6A/8 - Review history query preserves every Referee/Admin decision attached to the submission.
    // Loads chronological Referee/Admin decision history for one provisional submission.
    List<RaceResultReviewAction> findBySubmissionIdOrderByCreatedAtAsc(
            Integer submissionId
    );
}
