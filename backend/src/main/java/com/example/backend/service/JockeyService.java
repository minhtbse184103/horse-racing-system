package com.example.backend.service;

import java.util.List;

import com.example.backend.dto.request.JockeyProfileRequest;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.JockeyProfileResponse;

public interface JockeyService {
    JockeyProfileResponse getProfile();

    JockeyProfileResponse createProfile(JockeyProfileRequest request);

    JockeyProfileResponse updateProfile(JockeyProfileRequest request);

    void deleteProfile();

    List<JockeyInvitationResponse> getMyInvitations();

    JockeyInvitationResponse acceptInvitation(Integer invitationId);

    JockeyInvitationResponse rejectInvitation(Integer invitationId);
}
