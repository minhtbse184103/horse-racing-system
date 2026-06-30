package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.entity.Race;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class RaceRunWatchdogService {

    private final long timeoutMinutes;

    public RaceRunWatchdogService(
            @Value("${race.engine.watchdog-timeout-minutes:10}")
            long timeoutMinutes
    ) {
        this.timeoutMinutes = Math.max(1, timeoutMinutes);
    }

    public boolean isStuck(Race race, long resultCount) {
        return EventStatus.IN_PROGRESS.equals(race.getStatus())
                && race.getRunStartedAt() != null
                && resultCount == 0
                && !LocalDateTime.now().isBefore(
                race.getRunStartedAt().plusMinutes(timeoutMinutes)
        );
    }

    public long getElapsedMinutes(Race race) {
        if (race.getRunStartedAt() == null) {
            return 0;
        }

        return Math.max(
                0,
                Duration.between(race.getRunStartedAt(), LocalDateTime.now())
                        .toMinutes()
        );
    }

    public long getTimeoutMinutes() {
        return timeoutMinutes;
    }
}
