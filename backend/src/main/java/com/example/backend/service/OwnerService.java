package com.example.backend.service;

import java.util.List;

import com.example.backend.dto.request.CreateHorseRequest;
import com.example.backend.dto.request.InviteJockeyRequest;
import com.example.backend.dto.request.UpdateHorseRequest;
import com.example.backend.dto.response.HorseResponse;
import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.dto.response.OwnerDashboardResponse;

public interface OwnerService {
    OwnerDashboardResponse getDashboard();

    List<HorseResponse> getMyHorses();

    HorseResponse getMyHorseById(Integer horseId);

    HorseResponse createHorse(CreateHorseRequest request);

    HorseResponse updateHorse(Integer horseId, UpdateHorseRequest request);

    void deleteHorse(Integer horseId);

    List<JockeyInvitationResponse> getMyInvitations();

    JockeyInvitationResponse inviteJockey(InviteJockeyRequest request);

    JockeyInvitationResponse cancelInvitation(Integer invitationId);
}
