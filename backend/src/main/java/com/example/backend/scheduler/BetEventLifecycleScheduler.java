package com.example.backend.scheduler;

import com.example.backend.service.BettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BetEventLifecycleScheduler {

    private final BettingService bettingService;

    /**
     * Đồng bộ vòng đời theo lịch: DRAFT -> OPEN tại openAt và OPEN -> CLOSED tại closeAt.
     * Validation đặt vé vẫn kiểm tra trực tiếp openAt/closeAt giữa hai lần scheduler chạy.
     */
    @Scheduled(fixedDelayString = "${betting.lifecycle.delay-ms:30000}")
    public void synchronizeEventLifecycle() {
        bettingService.openScheduledEvents();
        bettingService.closeExpiredOpenEvents();
    }
}
