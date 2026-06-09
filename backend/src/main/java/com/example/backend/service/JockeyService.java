package com.example.backend.service;

import java.util.List;

import com.example.backend.dto.request.JockeyProfileRequest;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.JockeyProfileResponse;

public interface JockeyService {
    // Lấy hồ sơ jockey của tài khoản đang đăng nhập.
    JockeyProfileResponse getProfile();

    // Tạo hồ sơ jockey cho tài khoản đang đăng nhập.
    JockeyProfileResponse createProfile(JockeyProfileRequest request);

    // Cập nhật hồ sơ jockey của tài khoản đang đăng nhập.
    JockeyProfileResponse updateProfile(JockeyProfileRequest request);

    // Xóa hồ sơ jockey của tài khoản đang đăng nhập.
    void deleteProfile();

    // Lấy danh sách lời mời được gửi cho jockey.
    List<JockeyInvitationResponse> getMyInvitations();

    // Chấp nhận lời mời và gắn jockey vào registration.
    JockeyInvitationResponse acceptInvitation(Integer invitationId);

    // Từ chối lời mời được gửi cho jockey.
    JockeyInvitationResponse rejectInvitation(Integer invitationId);
}
