package com.example.backend.service;

import com.example.backend.entity.Race;
import com.example.backend.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RaceEngineTokenServiceTest {

    private final RaceEngineTokenService service = new RaceEngineTokenService();

    @Test
    void validateTokenAcceptsCurrentLaunchToken() {
        Race race = raceWithToken("new-token");

        assertDoesNotThrow(() -> service.validateToken(race, "new-token"));
    }

    @Test
    void validateTokenRejectsOldLaunchToken() {
        Race race = raceWithToken("new-token");

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateToken(race, "old-token")
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
    }

    private Race raceWithToken(String token) {
        Race race = new Race();
        race.setRaceEngineToken(token);
        return race;
    }
}
