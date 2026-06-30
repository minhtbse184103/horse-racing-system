package com.example.backend.service;

import com.example.backend.constant.PrizeDistributionStatus;
import com.example.backend.entity.PrizeDistribution;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.RacePrize;
import com.example.backend.entity.RaceResult;
import com.example.backend.entity.Registration;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.PrizeDistributionRepository;
import com.example.backend.repository.RacePrizeRepository;
import com.example.backend.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RacePrizeSettlementService {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final RacePrizeRepository racePrizeRepository;
    private final RegistrationRepository registrationRepository;
    private final PrizeDistributionRepository prizeDistributionRepository;

    public RacePrizeSettlementService(
            RacePrizeRepository racePrizeRepository,
            RegistrationRepository registrationRepository,
            PrizeDistributionRepository prizeDistributionRepository
    ) {
        this.racePrizeRepository = racePrizeRepository;
        this.registrationRepository = registrationRepository;
        this.prizeDistributionRepository = prizeDistributionRepository;
    }

    public void settlePrizes(
            Integer raceId,
            List<RaceResult> results,
            Map<Integer, RaceEntry> entriesByRaceEntryId
    ) {
        Map<Integer, RacePrize> prizesByRank = racePrizeRepository
                .findByRaceIdOrderByRankPositionAsc(raceId)
                .stream()
                .collect(Collectors.toMap(
                        RacePrize::getRankPosition,
                        Function.identity()
                ));

        if (prizesByRank.isEmpty()) {
            results.forEach(result -> result.setPrizeMoney(BigDecimal.ZERO));
            return;
        }

        Map<Integer, Registration> registrationsById =
                registrationRepository.findAllById(
                                entriesByRaceEntryId.values()
                                        .stream()
                                        .map(RaceEntry::getRegistrationId)
                                        .collect(Collectors.toSet())
                        )
                        .stream()
                        .collect(Collectors.toMap(
                                Registration::getRegistrationId,
                                Function.identity()
                        ));

        List<PrizeDistribution> distributions = results.stream()
                .map(result -> toDistribution(
                        raceId,
                        result,
                        prizesByRank.get(result.getFinishPosition()),
                        entriesByRaceEntryId,
                        registrationsById
                ))
                .filter(distribution -> distribution != null)
                .toList();

        if (!distributions.isEmpty()) {
            prizeDistributionRepository.saveAll(distributions);
        }
    }

    private PrizeDistribution toDistribution(
            Integer raceId,
            RaceResult result,
            RacePrize prize,
            Map<Integer, RaceEntry> entriesByRaceEntryId,
            Map<Integer, Registration> registrationsById
    ) {
        if (prize == null) {
            result.setPrizeMoney(BigDecimal.ZERO);
            return null;
        }

        BigDecimal totalPrize = money(prize.getAmount());
        result.setPrizeMoney(totalPrize);

        RaceEntry entry = entriesByRaceEntryId.get(result.getRaceEntryId());
        if (entry == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race result references an unknown race entry."
            );
        }

        Registration registration =
                registrationsById.get(entry.getRegistrationId());
        if (registration == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race entry registration does not exist."
            );
        }
        if (registration.getJockeyId() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race entry registration does not have a jockey."
            );
        }

        BigDecimal ownerAmount = totalPrize
                .multiply(prize.getOwnerPercent())
                .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
        BigDecimal jockeyAmount = totalPrize.subtract(ownerAmount);

        PrizeDistribution distribution = new PrizeDistribution();
        distribution.setRaceId(raceId);
        distribution.setRaceEntryId(entry.getRaceEntryId());
        distribution.setRacePrizeId(prize.getRacePrizeId());
        distribution.setOwnerId(registration.getOwnerId());
        distribution.setJockeyId(registration.getJockeyId());
        distribution.setTotalPrize(totalPrize);
        distribution.setOwnerAmount(ownerAmount);
        distribution.setJockeyAmount(jockeyAmount);
        distribution.setStatus(PrizeDistributionStatus.PENDING);
        return distribution;
    }

    private BigDecimal money(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
