package com.example.backend.service;

import java.util.List;

import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.InviteJockeyRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.dto.response.OwnerDashboardResponse;

public interface OwnerService {
    // Lấy số liệu tổng quan của owner đang đăng nhập.
    OwnerDashboardResponse getDashboard();

    // Lấy danh sách ngựa của owner đang đăng nhập.
    List<HorseResponse> getMyHorses();

    // Lấy chi tiết một ngựa thuộc owner đang đăng nhập.
    HorseResponse getMyHorseById(Integer horseId);

    // Tạo mới ngựa cho owner đang đăng nhập.
    HorseResponse createHorse(CreateHorseRequest request);

    // Cập nhật thông tin ngựa thuộc owner đang đăng nhập.
    HorseResponse updateHorse(Integer horseId, UpdateHorseRequest request);

    // Xóa ngựa thuộc owner nếu không còn registration active.
    void deleteHorse(Integer horseId);

    // Lấy danh sách lời mời jockey do owner gửi.
    List<JockeyInvitationResponse> getMyInvitations();

    // Lấy danh sách jockey đủ điều kiện để owner gửi lời mời.
    List<JockeyProfileResponse> getAvailableJockeys(Integer tournamentId);

    // Tạo lời mời jockey tham gia tournament cùng ngựa của owner.
    JockeyInvitationResponse inviteJockey(InviteJockeyRequest request);

    // Hủy lời mời jockey đang chờ phản hồi.
    JockeyInvitationResponse cancelInvitation(Integer invitationId);
}
