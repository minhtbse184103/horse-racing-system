package com.example.backend.service;

import com.example.backend.constant.PrizeDistributionStatus;
import com.example.backend.entity.PrizeDistribution;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RacePrize;
import com.example.backend.entity.RaceResult;
import com.example.backend.entity.Registration;
import com.example.backend.repository.PrizeDistributionRepository;
import com.example.backend.repository.RacePrizeRepository;
import com.example.backend.repository.RegistrationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePrizeSettlementServiceTest {

    private static final Integer RACE_ID = 20;

    @Mock
    private RacePrizeRepository racePrizeRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private PrizeDistributionRepository prizeDistributionRepository;

    private RacePrizeSettlementService service;

    @BeforeEach
    void setUp() {
        service = new RacePrizeSettlementService(
                racePrizeRepository,
                registrationRepository,
                prizeDistributionRepository
        );
    }

    @Test
    void settlePrizesSetsPrizeMoneyAndCreatesOwnerJockeyDistribution() {
        RaceResult first = result(1, 1);
        RaceResult second = result(2, 2);
        Map<Integer, RaceEntry> entries = Map.of(
                1, entry(1, 101),
                2, entry(2, 102)
        );

        when(racePrizeRepository.findByRaceIdOrderByRankPositionAsc(RACE_ID))
                .thenReturn(List.of(
                        prize(11, 1, "1000000.00", "70", "30"),
                        prize(12, 2, "500000.00", "80", "20")
                ));
        when(registrationRepository.findAllById(any()))
                .thenReturn(List.of(
                        registration(101, 201, 301),
                        registration(102, 202, 302)
                ));

        service.settlePrizes(RACE_ID, List.of(first, second), entries);

        assertEquals(new BigDecimal("1000000.00"), first.getPrizeMoney());
        assertEquals(new BigDecimal("500000.00"), second.getPrizeMoney());

        ArgumentCaptor<List<PrizeDistribution>> captor =
                ArgumentCaptor.forClass(List.class);
        verify(prizeDistributionRepository).saveAll(captor.capture());

        List<PrizeDistribution> distributions = captor.getValue();
        assertEquals(2, distributions.size());

        PrizeDistribution firstDistribution = distributions.get(0);
        assertEquals(RACE_ID, firstDistribution.getRaceId());
        assertEquals(1, firstDistribution.getRaceEntryId());
        assertEquals(11, firstDistribution.getRacePrizeId());
        assertEquals(201, firstDistribution.getOwnerId());
        assertEquals(301, firstDistribution.getJockeyId());
        assertEquals(new BigDecimal("1000000.00"), firstDistribution.getTotalPrize());
        assertEquals(new BigDecimal("700000.00"), firstDistribution.getOwnerAmount());
        assertEquals(new BigDecimal("300000.00"), firstDistribution.getJockeyAmount());
        assertEquals(PrizeDistributionStatus.PENDING, firstDistribution.getStatus());
    }

    @Test
    void settlePrizesSetsZeroForPositionsWithoutPrizeRule() {
        RaceResult first = result(1, 1);
        RaceResult fourth = result(4, 4);
        Map<Integer, RaceEntry> entries = Map.of(
                1, entry(1, 101),
                4, entry(4, 104)
        );

        when(racePrizeRepository.findByRaceIdOrderByRankPositionAsc(RACE_ID))
                .thenReturn(List.of(prize(11, 1, "1000000.00", "70", "30")));
        when(registrationRepository.findAllById(any()))
                .thenReturn(List.of(
                        registration(101, 201, 301),
                        registration(104, 204, 304)
                ));

        service.settlePrizes(RACE_ID, List.of(first, fourth), entries);

        assertEquals(new BigDecimal("1000000.00"), first.getPrizeMoney());
        assertEquals(BigDecimal.ZERO, fourth.getPrizeMoney());

        ArgumentCaptor<List<PrizeDistribution>> captor =
                ArgumentCaptor.forClass(List.class);
        verify(prizeDistributionRepository).saveAll(captor.capture());
        assertEquals(1, captor.getValue().size());
    }

    @Test
    void settlePrizesLeavesZeroPrizeMoneyWhenRaceHasNoPrizeRules() {
        RaceResult first = result(1, 1);

        when(racePrizeRepository.findByRaceIdOrderByRankPositionAsc(RACE_ID))
                .thenReturn(List.of());

        service.settlePrizes(
                RACE_ID,
                List.of(first),
                Map.of(1, entry(1, 101))
        );

        assertEquals(BigDecimal.ZERO, first.getPrizeMoney());
        verify(registrationRepository, never()).findAllById(any());
        verify(prizeDistributionRepository, never()).saveAll(any());
    }

    private RaceResult result(Integer raceEntryId, Integer finishPosition) {
        RaceResult result = new RaceResult();
        result.setRaceEntryId(raceEntryId);
        result.setFinishPosition(finishPosition);
        return result;
    }

    private RaceEntry entry(Integer raceEntryId, Integer registrationId) {
        RaceEntry entry = new RaceEntry();
        entry.setRaceEntryId(raceEntryId);
        entry.setRaceId(RACE_ID);
        entry.setRegistrationId(registrationId);
        entry.setStartingStall(raceEntryId);
        return entry;
    }

    private RacePrize prize(
            Integer racePrizeId,
            Integer rankPosition,
            String amount,
            String ownerPercent,
            String jockeyPercent
    ) {
        RacePrize prize = new RacePrize();
        prize.setRacePrizeId(racePrizeId);
        prize.setRaceId(RACE_ID);
        prize.setRankPosition(rankPosition);
        prize.setAmount(new BigDecimal(amount));
        prize.setOwnerPercent(new BigDecimal(ownerPercent));
        prize.setJockeyPercent(new BigDecimal(jockeyPercent));
        return prize;
    }

    private Registration registration(
            Integer registrationId,
            Integer ownerId,
            Integer jockeyId
    ) {
        Registration registration = new Registration();
        registration.setRegistrationId(registrationId);
        registration.setOwnerId(ownerId);
        registration.setJockeyId(jockeyId);
        return registration;
    }
}
