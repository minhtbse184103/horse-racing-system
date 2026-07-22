package com.example.backend.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.response.JockeyInvitationDetailResponse;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.JockeyProfileResponse;
import com.example.backend.dto.response.JockeyRaceResponse;
import com.example.backend.service.JockeyService;

@RestController
@RequestMapping("/api/jockey")
@PreAuthorize("hasRole('JOCKEY')")
public class JockeyController {
    private final JockeyService jockeyService;

    public JockeyController(JockeyService jockeyService) {
        this.jockeyService = jockeyService;
    }

    // Lấy hồ sơ jockey của tài khoản đang đăng nhập.
    @GetMapping("/profile")
    public JockeyProfileResponse getProfile() {
        return jockeyService.getProfile();
    }

    // Lấy danh sách lời mời tham gia tournament được gửi cho jockey.
    @GetMapping("/invitations")
    public List<JockeyInvitationResponse> getMyInvitations() {
        return jockeyService.getMyInvitations();
    }

    // Lấy danh sách Race đã được phân công cho jockey hiện tại.
    @GetMapping("/my-races")
    public List<JockeyRaceResponse> getMyRaces() {
        return jockeyService.getMyRaces();
    }

    // Lấy chi tiết lời mời kèm thông tin giải đấu và ngựa được mời.
    @GetMapping("/invitations/{invitationId}")
    public JockeyInvitationDetailResponse getMyInvitationDetail(@PathVariable Integer invitationId) {
        return jockeyService.getMyInvitationDetail(invitationId);
    }

    // Chấp nhận lời mời và tạo registration UNPAID cho owner thanh toán.
    @PutMapping("/invitations/{invitationId}/accept")
    public JockeyInvitationResponse acceptInvitation(@PathVariable Integer invitationId) {
        return jockeyService.acceptInvitation(invitationId);
    }

    // Từ chối lời mời đang chờ xử lý.
    @PutMapping("/invitations/{invitationId}/reject")
    public JockeyInvitationResponse rejectInvitation(@PathVariable Integer invitationId) {
        return jockeyService.rejectInvitation(invitationId);
    }
}
