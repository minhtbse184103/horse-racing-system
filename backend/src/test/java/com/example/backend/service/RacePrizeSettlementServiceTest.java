package com.example.backend.service;

import com.example.backend.entity.RacePrize;
import com.example.backend.entity.RaceResult;
import com.example.backend.repository.RacePrizeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePrizeSettlementServiceTest {

    private static final int RACE_ID = 1;

    @Mock private RacePrizeRepository racePrizeRepository;

    private RacePrizeSettlementService service;

    @BeforeEach
    void setUp() {
        service = new RacePrizeSettlementService(racePrizeRepository);
    }

    @Test
    void assignsConfiguredPrizeMoneyWithoutCreatingPayoutRecords() {
        RaceResult first = result(1);
        RaceResult second = result(2);
        when(racePrizeRepository.findByRaceIdOrderByRankPositionAsc(RACE_ID))
                .thenReturn(List.of(
                        prize(1, "1000000.00"),
                        prize(2, "500000.00")
                ));

        service.settlePrizes(RACE_ID, List.of(first, second));

        assertEquals(new BigDecimal("1000000.00"), first.getPrizeMoney());
        assertEquals(new BigDecimal("500000.00"), second.getPrizeMoney());
    }

    @Test
    void assignsZeroWhenFinishPositionHasNoPrizeRule() {
        RaceResult fourth = result(4);
        when(racePrizeRepository.findByRaceIdOrderByRankPositionAsc(RACE_ID))
                .thenReturn(List.of(prize(1, "1000000.00")));

        service.settlePrizes(RACE_ID, List.of(fourth));

        assertEquals(BigDecimal.ZERO, fourth.getPrizeMoney());
    }

    @Test
    void assignsZeroWhenRaceHasNoPrizeRules() {
        RaceResult first = result(1);
        when(racePrizeRepository.findByRaceIdOrderByRankPositionAsc(RACE_ID))
                .thenReturn(List.of());

        service.settlePrizes(RACE_ID, List.of(first));

        assertEquals(BigDecimal.ZERO, first.getPrizeMoney());
    }

    private RaceResult result(int finishPosition) {
        RaceResult result = new RaceResult();
        result.setFinishPosition(finishPosition);
        return result;
    }

    private RacePrize prize(int rank, String amount) {
        RacePrize prize = new RacePrize();
        prize.setRaceId(RACE_ID);
        prize.setRankPosition(rank);
        prize.setAmount(new BigDecimal(amount));
        return prize;
    }
}
