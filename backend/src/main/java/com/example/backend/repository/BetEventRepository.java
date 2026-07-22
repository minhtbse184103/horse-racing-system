package com.example.backend.repository;

import com.example.backend.entity.BetEvent;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BetEventRepository extends JpaRepository<BetEvent, Integer> {

    // LUỒNG: Admin tạo BetEvent
    // BẢNG: BetEvent.
    // Mục đích: tránh tạo trùng betting event cho cùng một cặp Race và BetProduct.
    // Spring Data tạo điều kiện: exists where raceId = :raceId and betProductId = :betProductId.
    // Một Race có thể có nhiều BetEvent theo từng BetProduct (WIN, PLACE...).
    // Cặp raceId + betProductId giúp tránh tạo trùng event cược cho cùng một Race và cùng loại cược.
    boolean existsByRaceIdAndBetProductId(Integer raceId, Integer betProductId);

    // LUỒNG: Spectator xem danh sách Betting Event
    // BẢNG: BetEvent.
    // Mục đích: hiển thị các event cược cho spectator theo trạng thái vòng đời, thường là OPEN/CLOSED.
    // Spring Data tạo điều kiện: where status in (:statuses) order by openAt asc.
    // Spectator chỉ xem các BetEvent theo trạng thái được truyền vào; mỗi event vẫn gắn với một raceId cụ thể.
    List<BetEvent> findByStatusInOrderByOpenAtAsc(Collection<String> statuses);

    // LUỒNG: Đồng bộ lịch Race và Betting
    // BẢNG: BetEvent.
    // Mục đích: đọc mọi betting event gắn với một race khi cần kiểm tra thời gian race hoặc trạng thái cược.
    // Spring Data tạo điều kiện: where raceId = :raceId order by openAt asc.
    // Dùng khi cần xem toàn bộ BetEvent của một Race, ví dụ lúc Race thay đổi thời gian hoặc đóng/mở cược.
    List<BetEvent> findByRaceIdOrderByOpenAtAsc(Integer raceId);

    // LUỒNG: Auto settlement sau khi có RaceResult chính thức
    // BẢNG: BetEvent.
    // Mục đích: lock toàn bộ BetEvent OPEN/CLOSED của một Race trước khi tính payout và set trạng thái SETTLED.
    // Cách xử lý: pessimistic write lock chặn place/cancel/settle chạy đồng thời làm đổi trạng thái event giữa lúc settle.
    // Lock các BetEvent của một Race khi settle/auto-settle để tránh vừa settle vừa đặt/hủy vé.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select event
            from BetEvent event
            where event.raceId = :raceId
              and event.status in :statuses
            order by event.openAt asc
            """)
    List<BetEvent> findByRaceIdAndStatusInForUpdate(
            @Param("raceId") Integer raceId,
            @Param("statuses") Collection<String> statuses
    );

    // LUỒNG: Place Bet, Cancel Ticket, Manual Settlement
    // BẢNG: BetEvent.
    // Mục đích: lock một BetEvent trước khi kiểm tra khung giờ mở/đóng, đổi trạng thái event hoặc settle ticket.
    // Cách xử lý: pessimistic write lock giúp các thay đổi trạng thái betting của event này chạy tuần tự.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select event
            from BetEvent event
            where event.betEventId = :betEventId
            """)
    Optional<BetEvent> findByIdForUpdate(@Param("betEventId") Integer betEventId);

    // LUỒNG: Demo Race Fast-Forward
    // BẢNG: BetEvent.
    // Mục đích: dời khung giờ cược quanh thời điểm hiện tại khi admin fast-forward race để demo/test.
    // Cách xử lý: cập nhật tất cả BetEvent của Race trừ event đã SETTLED để giữ nguyên lịch sử settlement.
    // Khi Race được launch/start sớm, cập nhật lại khung giờ cược của các BetEvent chưa SETTLED thuộc Race đó.
    @Modifying
    @Query("""
            update BetEvent event
            set event.openAt = :openAt,
                event.closeAt = :closeAt,
                event.updatedAt = :updatedAt
            where event.raceId = :raceId
              and event.status <> :settledStatus
            """)
    int fastForwardCloseTimeByRaceId(
            @Param("raceId") Integer raceId,
            @Param("openAt") java.time.LocalDateTime openAt,
            @Param("closeAt") java.time.LocalDateTime closeAt,
            @Param("updatedAt") java.time.LocalDateTime updatedAt,
            @Param("settledStatus") String settledStatus
    );
}
