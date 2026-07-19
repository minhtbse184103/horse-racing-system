package com.example.backend.service;

import com.example.backend.entity.RacePrize;
import com.example.backend.entity.RaceResult;
import com.example.backend.repository.RacePrizeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RacePrizeSettlementService {

    private final RacePrizeRepository racePrizeRepository;

    public void settlePrizes(Integer raceId, List<RaceResult> results) {
        Map<Integer, RacePrize> prizesByRank = racePrizeRepository
                .findByRaceIdOrderByRankPositionAsc(raceId)
                .stream()
                .collect(Collectors.toMap(
                        RacePrize::getRankPosition,
                        Function.identity()
                ));

        results.forEach(result -> {
            RacePrize prize = prizesByRank.get(result.getFinishPosition());
            result.setPrizeMoney(prize == null ? BigDecimal.ZERO : money(prize.getAmount()));
        });
    }

    private BigDecimal money(BigDecimal value) {
        return value == null
                ? BigDecimal.ZERO
                : value.setScale(2, RoundingMode.HALF_UP);
    }
}
