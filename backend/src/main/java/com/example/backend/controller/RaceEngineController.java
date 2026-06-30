package com.example.backend.controller;

import com.example.backend.dto.request.RaceResultIngestRequest;
import com.example.backend.dto.response.RaceLineupResponse;
import com.example.backend.dto.response.RaceResultIngestResponse;
import com.example.backend.service.RaceEngineQueryService;
import com.example.backend.service.RaceLiveBroadcastService;
import com.example.backend.service.RaceLiveTickService;
import com.example.backend.service.RaceResultIngestionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints called by the Unity race engine process, not by browser
 * clients. Authenticated by a per-launch X-Race-Engine-Key token via
 * RaceEngineSecurityConfig's dedicated filter chain and service-level
 * Race validation on /api/race-engine/** — no JWT user auth here.
 *
 * Result and tick broadcasts to spectators happen here at the
 * controller layer, after the service calls return — by then the
 * @Transactional ingestResult() call has already committed, so a
 * broadcast can't fire for a result that ends up rolled back.
 */
@RestController
@RequestMapping("/api/race-engine")
public class RaceEngineController {

    private static final String RACE_ENGINE_TOKEN_HEADER = "X-Race-Engine-Key";

    private final RaceEngineQueryService raceEngineQueryService;
    private final RaceResultIngestionService raceResultIngestionService;
    private final RaceLiveTickService raceLiveTickService;
    private final RaceLiveBroadcastService raceLiveBroadcastService;

    public RaceEngineController(
            RaceEngineQueryService raceEngineQueryService,
            RaceResultIngestionService raceResultIngestionService,
            RaceLiveTickService raceLiveTickService,
            RaceLiveBroadcastService raceLiveBroadcastService
    ) {
        this.raceEngineQueryService = raceEngineQueryService;
        this.raceResultIngestionService = raceResultIngestionService;
        this.raceLiveTickService = raceLiveTickService;
        this.raceLiveBroadcastService = raceLiveBroadcastService;
    }

    @GetMapping("/{raceId}/lineup")
    public RaceLineupResponse getLineup(
            @PathVariable Integer raceId,
            @RequestHeader(RACE_ENGINE_TOKEN_HEADER) String raceEngineToken
    ) {
        return raceEngineQueryService.getLineup(raceId, raceEngineToken);
    }

    @PostMapping("/{raceId}/tick")
    public void postTick(
            @PathVariable Integer raceId,
            @RequestHeader(RACE_ENGINE_TOKEN_HEADER) String raceEngineToken,
            @RequestBody Map<String, Object> tickPayload
    ) {
        raceLiveTickService.relayTick(raceId, raceEngineToken, tickPayload);
    }

    @PostMapping("/{raceId}/result")
    public RaceResultIngestResponse postResult(
            @PathVariable Integer raceId,
            @RequestHeader(RACE_ENGINE_TOKEN_HEADER) String raceEngineToken,
            @Valid @RequestBody RaceResultIngestRequest request
    ) {
        RaceResultIngestResponse response =
                raceResultIngestionService.ingestResult(
                        raceId,
                        raceEngineToken,
                        request
                );

        raceLiveBroadcastService.broadcastResult(raceId, response);

        return response;
    }
}
