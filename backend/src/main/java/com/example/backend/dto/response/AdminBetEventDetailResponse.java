package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AdminBetEventDetailResponse {
    private BetEventResponse event;
    private List<AdminBetTicketResponse> tickets;
    private BetSettlementResponse settlement;
}
