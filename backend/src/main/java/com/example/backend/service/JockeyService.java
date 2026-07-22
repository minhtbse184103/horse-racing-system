package com.example.backend.service;

import java.util.List;

import com.example.backend.dto.request.JockeyProfileRequest;
import com.example.backend.dto.response.JockeyInvitationDetailResponse;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.dto.response.JockeyRaceResponse;

public interface JockeyService {
    // Lấy hồ sơ jockey của tài khoản đang đăng nhập.
    JockeyProfileResponse getProfile();

    // Admin xem hồ sơ jockey theo user id.
    JockeyProfileResponse getAdminProfile(Integer jockeyId);

    // Tạo hồ sơ jockey cho tài khoản đang đăng nhập.
    JockeyProfileResponse createProfile(JockeyProfileRequest request);

    // Cập nhật hồ sơ jockey của tài khoản đang đăng nhập.
    JockeyProfileResponse updateProfile(JockeyProfileRequest request);

    // Chuyển hồ sơ jockey của tài khoản đang đăng nhập sang INACTIVE.
    JockeyProfileResponse deactivateProfile();

    // Lấy danh sách lời mời được gửi cho jockey.
    List<JockeyInvitationResponse> getMyInvitations();

    // Lấy danh sách RaceEntry đã được phân công cho jockey hiện tại.
    List<JockeyRaceResponse> getMyRaces();

    // Lấy chi tiết lời mời kèm thông tin giải đấu và ngựa được mời.
    JockeyInvitationDetailResponse getMyInvitationDetail(Integer invitationId);

    // Chấp nhận lời mời và tạo registration UNPAID/PENDING.
    JockeyInvitationResponse acceptInvitation(Integer invitationId);

    // Từ chối lời mời được gửi cho jockey.
    JockeyInvitationResponse rejectInvitation(Integer invitationId);
}
