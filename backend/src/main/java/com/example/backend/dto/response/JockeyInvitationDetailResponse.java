package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JockeyInvitationDetailResponse {
    private JockeyInvitationResponse invitation;
    private TournamentDetailResponse tournament;
    private HorseResponse horse;
}
