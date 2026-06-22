package com.example.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyProfile;

@Repository
public interface JockeyProfileRepository extends JpaRepository<JockeyProfile, Integer> {
    List<JockeyProfile> findByJockeyIdIn(Collection<Integer> jockeyIds);
}
