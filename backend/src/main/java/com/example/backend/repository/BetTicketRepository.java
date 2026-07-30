package com.example.backend.repository;

import com.example.backend.entity.BetTicket;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BetTicketRepository extends JpaRepository<BetTicket, Integer> {

    // LUỒNG: Spectator xem My Tickets
    // BẢNG: BetTicket.
    // Mục đích: hiển thị lịch sử vé cược của spectator hiện tại, vé mới nhất lên trước.
    // Spring Data tạo điều kiện: where userId = :userId order by placedAt desc.
    // Lịch sử vé cược của spectator hiện tại, sắp xếp vé mới nhất lên trước.
    List<BetTicket> findByUserIdOrderByPlacedAtDesc(Integer userId);

    // LUỒNG: Admin xem chi tiết BetEvent / Settlement Detail
    // BẢNG: BetTicket.
    // Mục đích: liệt kê mọi ticket thuộc một BetEvent để admin kiểm tra và xem chi tiết settlement.
    // Spring Data tạo điều kiện: where betEventId = :betEventId order by placedAt asc.
    // Admin/detail event dùng danh sách ticket theo một BetEvent cụ thể.
    List<BetTicket> findByBetEventIdOrderByPlacedAtAsc(Integer betEventId);

    // LUỒNG: Spectator hủy Ticket
    // BẢNG: BetTicket.
    // Mục đích: lock một ticket trước khi đổi trạng thái từ PLACED sang REFUNDED và mở khóa tiền trong ví.
    // Cách xử lý: pessimistic write lock chặn thao tác hủy chạy đua với settlement.
    // Lock một ticket khi hủy để tránh trạng thái ticket bị đổi đồng thời bởi settle/refund.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select ticket
            from BetTicket ticket
            where ticket.betTicketId = :betTicketId
            """)
    Optional<BetTicket> findByIdForUpdate(@Param("betTicketId") Integer betTicketId);

    // LUỒNG: Bet Settlement
    // BẢNG: BetTicket.
    // Mục đích: lock toàn bộ ticket PLACED trong một BetEvent trước khi tính thắng/thua, odds, payout và cập nhật ví.
    // Cách xử lý: chỉ settle ticket có status được truyền vào; ticket REFUNDED/VOID không tham gia payout.
    // Lock toàn bộ vé PLACED của một BetEvent trong lúc settle để tính thắng/thua và payout nhất quán.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select ticket
            from BetTicket ticket
            where ticket.betEventId = :betEventId
              and ticket.status = :status
            order by ticket.placedAt asc
            """)
    List<BetTicket> findPlacedByEventForUpdate(
            @Param("betEventId") Integer betEventId,
            @Param("status") String status
    );

    // LUỒNG: Kiểm tra daily limit khi Place Bet
    // BẢNG: BetTicket, BetEvent.
    // Mục đích: tính tổng số tiền user đã cược trong ngày cho một BetProduct cụ thể.
    // Cách xử lý: BetTicket lưu betEventId, còn BetEvent lưu betProductId, nên query phải join BetEvent.
    // Bộ lọc status chỉ tính các ticket còn hiệu lực vào tổng daily limit.
    // Giới hạn cược theo ngày được tính theo user + loại BetProduct.
    // Join qua BetEvent vì BetTicket chỉ lưu betEventId, còn product nằm ở BetEvent.
    @Query("""
            select coalesce(sum(ticket.stake), 0)
            from BetTicket ticket
            join BetEvent event on event.betEventId = ticket.betEventId
            where ticket.userId = :userId
              and event.betProductId = :betProductId
              and ticket.placedAt >= :startAt
              and ticket.placedAt < :endAt
              and ticket.status in :statuses
            """)
    BigDecimal sumDailyStake(
            @Param("userId") Integer userId,
            @Param("betProductId") Integer betProductId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("statuses") Collection<String> statuses
    );

    // LUỒNG: Tính Bet Pool/Odds
    // BẢNG: BetTicket.
    // Mục đích: tính tổng stake pool của một BetEvent.
    // Cách xử lý: dùng cho event response, estimated odds và settlement; bộ lọc status loại REFUNDED/VOID.
    // Tổng pool của một BetEvent: cộng stake của tất cả ticket còn hiệu lực trong event đó.
    @Query("""
            select coalesce(sum(ticket.stake), 0)
            from BetTicket ticket
            where ticket.betEventId = :betEventId
              and ticket.status in :statuses
            """)
    BigDecimal sumStakeByEvent(
            @Param("betEventId") Integer betEventId,
            @Param("statuses") Collection<String> statuses
    );

    // LUỒNG: Spectator xem tổng tiền cược của toàn Race.
    // Khác totalStake của từng BetEvent, số này cộng mọi product cược thuộc cùng Race.
    @Query("""
            select coalesce(sum(ticket.stake), 0)
            from BetTicket ticket
            where ticket.raceId = :raceId
              and ticket.status in :statuses
            """)
    BigDecimal sumStakeByRace(
            @Param("raceId") Integer raceId,
            @Param("statuses") Collection<String> statuses
    );

    // LUỒNG: Tính Entry Pool/Odds
    // BẢNG: BetTicket.
    // Mục đích: tính tổng stake đặt vào một RaceEntry trong một BetEvent.
    // Cách xử lý: BetEvent tách pool theo product như WIN và PLACE; RaceEntry xác định horse được chọn trong race đó.
    // Tổng tiền cược của một "con ngựa trong Race" được tính bằng BetEvent + RaceEntry.
    // raceEntryId đại diện cho ngựa ở đúng Race đó; betEventId tách riêng pool giữa các event/loại cược.
    @Query("""
            select coalesce(sum(ticket.stake), 0)
            from BetTicket ticket
            where ticket.betEventId = :betEventId
              and ticket.raceEntryId = :raceEntryId
              and ticket.status in :statuses
            """)
    BigDecimal sumStakeByEventAndRaceEntry(
            @Param("betEventId") Integer betEventId,
            @Param("raceEntryId") Integer raceEntryId,
            @Param("statuses") Collection<String> statuses
    );
}
