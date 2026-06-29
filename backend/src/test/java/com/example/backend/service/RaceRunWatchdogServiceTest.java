package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.entity.Race;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RaceRunWatchdogServiceTest {

    private final RaceRunWatchdogService service =
            new RaceRunWatchdogService(10);

    @Test
    void isStuckReturnsTrueForLaunchedInProgressRacePastTimeoutWithoutResult() {
        Race race = launchedRace();
        race.setRunStartedAt(LocalDateTime.now().minusMinutes(11));

        assertTrue(service.isStuck(race, 0));
    }

    @Test
    void isStuckReturnsFalseWhenResultExists() {
        Race race = launchedRace();
        race.setRunStartedAt(LocalDateTime.now().minusMinutes(11));

        assertFalse(service.isStuck(race, 1));
    }

    @Test
    void isStuckReturnsFalseBeforeTimeout() {
        Race race = launchedRace();
        race.setRunStartedAt(LocalDateTime.now().minusMinutes(5));

        assertFalse(service.isStuck(race, 0));
    }

    @Test
    void isStuckReturnsFalseWhenRaceWasNotLaunched() {
        Race race = launchedRace();
        race.setRunStartedAt(null);

        assertFalse(service.isStuck(race, 0));
    }

    private Race launchedRace() {
        Race race = new Race();
        race.setRaceId(1);
        race.setStatus(EventStatus.IN_PROGRESS);
        race.setRunStartedAt(LocalDateTime.now().minusMinutes(11));
        return race;
    }
}
