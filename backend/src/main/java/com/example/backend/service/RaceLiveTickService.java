package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.entity.Race;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Validates and relays Unity's per-tick position updates. This is a
 * pure relay: the backend does not interpret tick contents, it only
 * confirms the race is actually live before fanning the payload out
 * to spectators via RaceLiveBroadcastService. No RaceResult/DB write
 * happens here — that's RaceResultIngestionService's job once the
 * race finishes.
 */
@Service
public class RaceLiveTickService {

    private final RaceRepository raceRepository;
    private final RaceLiveBroadcastService raceLiveBroadcastService;
    private final RaceEngineTokenService raceEngineTokenService;

    public RaceLiveTickService(
            RaceRepository raceRepository,
            RaceLiveBroadcastService raceLiveBroadcastService,
            RaceEngineTokenService raceEngineTokenService
    ) {
        this.raceRepository = raceRepository;
        this.raceLiveBroadcastService = raceLiveBroadcastService;
        this.raceEngineTokenService = raceEngineTokenService;
    }

    @Transactional(readOnly = true)
    public void relayTick(
            Integer raceId,
            String raceEngineToken,
            Map<String, Object> tickPayload
    ) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));
        raceEngineTokenService.validateToken(race, raceEngineToken);

        if (race.getRunStartedAt() == null
                || !EventStatus.IN_PROGRESS.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race is not currently live."
            );
        }

        raceLiveBroadcastService.broadcastTick(raceId, tickPayload);
    }
}
