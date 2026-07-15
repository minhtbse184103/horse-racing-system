package com.example.backend.repository;

import com.example.backend.entity.BetProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BetProductRepository extends JpaRepository<BetProduct, Integer> {

    Optional<BetProduct> findByCodeIgnoreCase(String code);

    List<BetProduct> findByActiveTrueOrderByCodeAsc();
}
