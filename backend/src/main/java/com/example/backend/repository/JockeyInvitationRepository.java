package com.example.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyInvitation;

@Repository
public interface JockeyInvitationRepository extends JpaRepository<JockeyInvitation, Integer> {

    // LUỒNG: Owner quản lý lời mời
    // BẢNG: JockeyInvitation.
    // Mục đích: owner xem tất cả lời mời đã gửi, lời mời mới nhất lên trước.
    // Spring Data tạo điều kiện: where ownerId = :ownerId order by createdAt desc.
    List<JockeyInvitation> findByOwnerIdOrderByCreatedAtDesc(Integer ownerId);

    // LUỒNG: Hộp thư lời mời của Jockey
    // BẢNG: JockeyInvitation.
    // Mục đích: jockey xem tất cả lời mời được gửi cho mình, lời mời mới nhất lên trước.
    // Spring Data tạo điều kiện: where jockeyId = :jockeyId order by createdAt desc.
    List<JockeyInvitation> findByJockeyIdOrderByCreatedAtDesc(Integer jockeyId);

    // LUỒNG: Owner xem/hủy lời mời
    // BẢNG: JockeyInvitation.
    // Mục đích: chỉ lấy một lời mời nếu lời mời đó thuộc owner hiện tại.
    // Spring Data tạo điều kiện: where invitationId = :invitationId and ownerId = :ownerId.
    Optional<JockeyInvitation> findByInvitationIdAndOwnerId(Integer invitationId, Integer ownerId);

    // LUỒNG: Jockey xem/chấp nhận/từ chối lời mời
    // BẢNG: JockeyInvitation.
    // Mục đích: chỉ lấy một lời mời nếu lời mời đó thuộc jockey hiện tại.
    // Spring Data tạo điều kiện: where invitationId = :invitationId and jockeyId = :jockeyId.
    Optional<JockeyInvitation> findByInvitationIdAndJockeyId(Integer invitationId, Integer jockeyId);

    // LUỒNG: Chặn trùng lời mời
    // BẢNG: JockeyInvitation.
    // Mục đích: kiểm tra một registration đã có lời mời cho jockey này với trạng thái này chưa.
    // Spring Data tạo điều kiện: exists where registrationId = :registrationId and jockeyId = :jockeyId and status = :status.
    boolean existsByRegistrationIdAndJockeyIdAndStatus(Integer registrationId, Integer jockeyId, String status);

    // LUỒNG: Chặn thao tác xóa/nghiệp vụ Horse khi đã có lời mời
    // BẢNG: JockeyInvitation.
    // Mục đích: kiểm tra horse đã từng có lời mời nào chưa trước khi cho phép thao tác ảnh hưởng dữ liệu.
    // Spring Data tạo điều kiện: exists where horseId = :horseId.
    boolean existsByHorseId(Integer horseId);

    // LUỒNG: Chặn trùng lời mời
    // BẢNG: JockeyInvitation.
    // Mục đích: tránh tạo trùng lời mời có cùng tournament + horse + jockey + status.
    // Spring Data tạo điều kiện: exists where tournamentId, horseId, jockeyId, and status all match.
    boolean existsByTournamentIdAndHorseIdAndJockeyIdAndStatus(
            Integer tournamentId,
            Integer horseId,
            Integer jockeyId,
            String status);

    // LUỒNG: Chặn trùng lời mời
    // BẢNG: JockeyInvitation.
    // Mục đích: kiểm tra trùng chặt hơn, có tính cả owner đã gửi lời mời.
    // Spring Data tạo điều kiện: exists where tournamentId, horseId, ownerId, jockeyId, and status all match.
    boolean existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
            Integer tournamentId,
            Integer horseId,
            Integer ownerId,
            Integer jockeyId,
            String status);

    // LUỒNG: Owner gửi/cập nhật lời mời
    // BẢNG: JockeyInvitation, Tournament.
    // Mục đích: phát hiện owner đã có lời mời pending khác trong cùng tournament chưa.
    // Cách xử lý: status phải khớp, lời mời hết hạn bị bỏ qua, có thể loại trừ lời mời hiện tại khi cập nhật.
    @Query("""
            select count(i) > 0
            from JockeyInvitation i
            where i.tournamentId = :tournamentId
              and i.ownerId = :ownerId
              and i.status = :invitationStatus
              and (i.expiredAt is null or i.expiredAt > :now)
              and (:excludedInvitationId is null or i.invitationId <> :excludedInvitationId)
            """)
    boolean existsPendingInvitationForTournamentAndOwner(
            @Param("tournamentId") Integer tournamentId,
            @Param("ownerId") Integer ownerId,
            @Param("invitationStatus") String invitationStatus,
            @Param("now") java.time.LocalDateTime now,
            @Param("excludedInvitationId") Integer excludedInvitationId);

    // LUỒNG: Owner gửi lời mời
    // BẢNG: JockeyInvitation.
    // Mục đích: không cho một jockey có lời mời active khác trong cùng tournament.
    // Cách xử lý: đếm lời mời theo tournament + jockey + status.
    @Query("""
            select count(i) > 0
            from JockeyInvitation i
            where i.tournamentId = :tournamentId
              and i.jockeyId = :jockeyId
              and i.status = :invitationStatus
            """)
    boolean existsActiveInvitationForTournamentAndJockey(
            @Param("tournamentId") Integer tournamentId,
            @Param("jockeyId") Integer jockeyId,
            @Param("invitationStatus") String invitationStatus);

    // LUỒNG: Owner gửi/cập nhật lời mời
    // BẢNG: JockeyInvitation, Tournament.
    // Mục đích: tránh mời jockey đang có lời mời pending bị trùng lịch với tournament mới.
    // Cách xử lý: join Tournament để so sánh khoảng ngày; bỏ qua lời mời hết hạn và lời mời đang sửa.
    @Query("""
            select count(i) > 0
            from JockeyInvitation i
            join Tournament t on t.tournamentId = i.tournamentId
            where i.jockeyId = :jockeyId
              and i.status = :invitationStatus
              and (i.expiredAt is null or i.expiredAt > :now)
              and (:excludedInvitationId is null or i.invitationId <> :excludedInvitationId)
              and t.startDate <= :endDate
              and t.endDate >= :startDate
            """)
    boolean existsPendingOverlappingInvitationForJockey(
            @Param("jockeyId") Integer jockeyId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate,
            @Param("invitationStatus") String invitationStatus,
            @Param("now") java.time.LocalDateTime now,
            @Param("excludedInvitationId") Integer excludedInvitationId);

    // LUỒNG: Owner gửi/cập nhật lời mời
    // BẢNG: JockeyInvitation, Tournament.
    // Mục đích: tránh cùng một horse bị gắn vào lời mời pending khác trong khoảng ngày tournament bị trùng.
    // Cách xử lý: join Tournament để kiểm tra trùng lịch và bỏ qua lời mời hết hạn/lời mời hiện tại.
    @Query("""
            select count(i) > 0
            from JockeyInvitation i
            join Tournament t on t.tournamentId = i.tournamentId
            where i.horseId = :horseId
              and i.status = :invitationStatus
              and (i.expiredAt is null or i.expiredAt > :now)
              and (:excludedInvitationId is null or i.invitationId <> :excludedInvitationId)
              and t.startDate <= :endDate
              and t.endDate >= :startDate
            """)
    boolean existsPendingOverlappingInvitationForHorse(
            @Param("horseId") Integer horseId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate,
            @Param("invitationStatus") String invitationStatus,
            @Param("now") java.time.LocalDateTime now,
            @Param("excludedInvitationId") Integer excludedInvitationId);

    // LUỒNG: Owner gửi/cập nhật lời mời
    // BẢNG: JockeyInvitation, Tournament.
    // Mục đích: tránh cùng cặp horse + jockey có nhiều lời mời pending bị trùng lịch.
    // Cách xử lý: kết hợp horse, jockey, status, điều kiện chưa hết hạn, loại trừ tùy chọn và khoảng ngày Tournament.
    @Query("""
            select count(i) > 0
            from JockeyInvitation i
            join Tournament t on t.tournamentId = i.tournamentId
            where i.horseId = :horseId
              and i.jockeyId = :jockeyId
              and i.status = :invitationStatus
              and (i.expiredAt is null or i.expiredAt > :now)
              and (:excludedInvitationId is null or i.invitationId <> :excludedInvitationId)
              and t.startDate <= :endDate
              and t.endDate >= :startDate
            """)
    boolean existsPendingOverlappingInvitationForHorseAndJockey(
            @Param("horseId") Integer horseId,
            @Param("jockeyId") Integer jockeyId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDate") java.time.LocalDate endDate,
            @Param("invitationStatus") String invitationStatus,
            @Param("now") java.time.LocalDateTime now,
            @Param("excludedInvitationId") Integer excludedInvitationId);

    // LUỒNG: Dọn dữ liệu Registration
    // BẢNG: JockeyInvitation.
    // Mục đích: xóa các lời mời gắn với những registration đang bị xóa/hủy theo lô.
    // Spring Data tạo điều kiện: delete where registrationId in (:registrationIds).
    void deleteByRegistrationIdIn(Collection<Integer> registrationIds);
}
