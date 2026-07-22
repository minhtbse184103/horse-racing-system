package com.example.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyVerificationFile;

@Repository
public interface JockeyVerificationFileRepository extends JpaRepository<JockeyVerificationFile, Integer> {

    // LUỒNG: Chi tiết hồ sơ/xác minh Jockey
    // BẢNG: JockeyVerificationFile.
    // Mục đích: lấy các file minh chứng đã upload thuộc về một dòng JockeyVerification.
    // Spring Data tạo điều kiện: where verificationId = :verificationId.
    // Lấy tất cả file đính kèm của một verification.
    List<JockeyVerificationFile> findByVerificationId(Integer verificationId);

    // LUỒNG: Jockey gửi lại hồ sơ xác minh
    // BẢNG: JockeyVerificationFile.
    // Mục đích: xóa các file minh chứng cũ trước khi lưu bộ file mới khi resubmit.
    // Spring Data tạo điều kiện: delete where verificationId = :verificationId.
    // Xóa tất cả file đính kèm của một verification khi jockey resubmit.
    void deleteByVerificationId(Integer verificationId);
}
