package com.example.backend.repository;

import com.example.backend.entity.BetProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BetProductRepository extends JpaRepository<BetProduct, Integer> {

    // LUỒNG: Tra cứu Betting Product
    // BẢNG: BetProduct.
    // Mục đích: tìm một betting product theo code, ví dụ WIN hoặc PLACE.
    // Spring Data tạo điều kiện: where lower(code) = lower(:code).
    Optional<BetProduct> findByCodeIgnoreCase(String code);

    // LUỒNG: Chọn Betting Product
    // BẢNG: BetProduct.
    // Mục đích: liệt kê các betting product đang active để tạo/mở BetEvent.
    // Spring Data tạo điều kiện: where active = true order by code asc.
    List<BetProduct> findByActiveTrueOrderByCodeAsc();
}
