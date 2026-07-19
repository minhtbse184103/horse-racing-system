package com.example.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AdminBetSettlementDetailResponse {
    private AdminBetSettlementSummaryResponse settlement;
    private List<AdminBetTicketResponse> tickets;
}
