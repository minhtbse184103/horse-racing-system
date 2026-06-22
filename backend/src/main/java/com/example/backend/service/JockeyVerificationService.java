package com.example.backend.service;

import java.util.List;

import com.example.backend.dto.baseResponseDTO.ApiResponse;
import com.example.backend.dto.request.JockeyVerificationRequest;
import com.example.backend.dto.response.JockeyVerificationResponse;

public interface JockeyVerificationService {

    // Jockey gửi yêu cầu xác minh lần đầu.
    ApiResponse<JockeyVerificationResponse> submitVerification(JockeyVerificationRequest request);

    // Jockey cập nhật và gửi lại yêu cầu xác minh sau khi bị từ chối.
    ApiResponse<JockeyVerificationResponse> resubmitVerification(Integer verificationId, JockeyVerificationRequest request);

    // Jockey xem trạng thái xác minh hiện tại của mình.
    ApiResponse<JockeyVerificationResponse> getMyVerification();

    // Jockey xem lịch sử tất cả yêu cầu xác minh của mình.
    ApiResponse<List<JockeyVerificationResponse>> getMyVerificationHistory();

    // Admin lấy danh sách yêu cầu xác minh đang chờ duyệt.
    ApiResponse<List<JockeyVerificationResponse>> getPendingVerifications();

    // Admin xem chi tiết một yêu cầu xác minh.
    ApiResponse<JockeyVerificationResponse> getVerificationById(Integer verificationId);

    // Admin phê duyệt yêu cầu xác minh.
    ApiResponse<JockeyVerificationResponse> approveVerification(Integer verificationId);

    // Admin từ chối yêu cầu xác minh với lý do.
    ApiResponse<JockeyVerificationResponse> rejectVerification(Integer verificationId, String rejectionReason);
}
