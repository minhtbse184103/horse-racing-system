package com.example.backend.scheduler;

import com.example.backend.service.BettingService;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class BetEventLifecycleSchedulerTest {

    @Test
    void synchronizeEventLifecycleOpensScheduledThenClosesExpiredEvents() {
        BettingService bettingService = mock(BettingService.class);
        BetEventLifecycleScheduler scheduler = new BetEventLifecycleScheduler(bettingService);

        scheduler.synchronizeEventLifecycle();

        verify(bettingService).openScheduledEvents();
        verify(bettingService).closeExpiredOpenEvents();
    }
}
