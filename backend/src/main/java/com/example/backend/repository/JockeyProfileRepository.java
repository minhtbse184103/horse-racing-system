package com.example.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.JockeyProfile;

@Repository
public interface JockeyProfileRepository extends JpaRepository<JockeyProfile, Integer> {

    // LUỒNG: Đọc hồ sơ Jockey
    // BẢNG: JockeyProfile.
    // Mục đích: lấy hồ sơ cho một danh sách jockey user ID, thường dùng sau khi query khác đã chọn ra các jockey ID.
    // Spring Data tạo điều kiện: where jockeyId in (:jockeyIds).
    List<JockeyProfile> findByJockeyIdIn(Collection<Integer> jockeyIds);
}
