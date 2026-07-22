package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyVerification;

@Repository
public interface JockeyVerificationRepository extends JpaRepository<JockeyVerification, Integer> {

    // LUỒNG: Lịch sử xác minh Jockey/Admin
    // BẢNG: JockeyVerification.
    // Mục đích: lấy tất cả hồ sơ xác minh của một jockey, mới nhất lên trước để hiển thị lịch sử.
    // Spring Data tạo điều kiện: where jockeyId = :jockeyId order by createdAt desc.
    // Lấy tất cả verification của một jockey, sắp xếp mới nhất lên trước.
    List<JockeyVerification> findByJockeyIdOrderByCreatedAtDesc(Integer jockeyId);

    // LUỒNG: Chi tiết hồ sơ Jockey
    // BẢNG: JockeyVerification.
    // Mục đích: gắn dữ liệu giấy phép/academy mới nhất vào JockeyProfileResponse.
    // Spring Data tạo điều kiện: where jockeyId = :jockeyId order by createdAt desc limit 1.
    // Lấy verification mới nhất của jockey.
    Optional<JockeyVerification> findFirstByJockeyIdOrderByCreatedAtDesc(Integer jockeyId);

    // LUỒNG: Hàng chờ duyệt xác minh Jockey của Admin
    // BẢNG: JockeyVerification.
    // Mục đích: liệt kê hồ sơ đang chờ duyệt từ cũ đến mới để admin xử lý theo thứ tự gửi lên.
    // Spring Data tạo điều kiện: where verificationStatus = :verificationStatus order by submittedAt asc.
    // Lấy tất cả verification đang PENDING để admin xét duyệt.
    List<JockeyVerification> findByVerificationStatusOrderBySubmittedAtAsc(String verificationStatus);

    // LUỒNG: Lịch sử duyệt xác minh Jockey của Admin
    // BẢNG: JockeyVerification.
    // Mục đích: liệt kê hồ sơ đã được xử lý theo trạng thái, hồ sơ được review mới nhất lên trước.
    // Spring Data tạo điều kiện: where verificationStatus = :verificationStatus order by reviewedAt desc.
    List<JockeyVerification> findByVerificationStatusOrderByReviewedAtDesc(String verificationStatus);

    // LUỒNG: Chặn gửi trùng hồ sơ xác minh Jockey
    // BẢNG: JockeyVerification.
    // Mục đích: không cho jockey tạo hồ sơ mới khi đã có hồ sơ cùng trạng thái đang tồn tại.
    // Spring Data tạo điều kiện: exists where jockeyId = :jockeyId and verificationStatus = :verificationStatus.
    // Kiểm tra jockey có verification đang PENDING không.
    boolean existsByJockeyIdAndVerificationStatus(Integer jockeyId, String verificationStatus);
}
