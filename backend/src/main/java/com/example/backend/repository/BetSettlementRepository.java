package com.example.backend.repository;

import com.example.backend.entity.BetSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BetSettlementRepository extends JpaRepository<BetSettlement, Integer> {

    // LUỒNG: Chặn settle trùng
    // BẢNG: BetSettlement.
    // Mục đích: không cho settle cùng một BetEvent nhiều lần.
    // Spring Data tạo điều kiện: exists where betEventId = :betEventId.
    boolean existsByBetEventId(Integer betEventId);

    // LUỒNG: Chi tiết Bet Settlement
    // BẢNG: BetSettlement.
    // Mục đích: lấy tổng hợp settlement của một BetEvent sau manual settlement hoặc auto settlement.
    // Spring Data tạo điều kiện: where betEventId = :betEventId.
    Optional<BetSettlement> findByBetEventId(Integer betEventId);

    // LUỒNG: Admin xem lịch sử Betting Settlement
    // BẢNG: BetSettlement.
    // Mục đích: liệt kê các betting event đã settle, mới nhất lên trước cho dashboard admin betting.
    // Spring Data tạo điều kiện: order by settledAt desc.
    List<BetSettlement> findAllByOrderBySettledAtDesc();
}
