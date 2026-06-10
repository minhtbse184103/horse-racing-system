package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.dto.request.CreateRaceEntryRequest;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.Registration;
import com.example.backend.entity.TournamentRound;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRoundRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RaceEntryService {

    private static final String CONFIRMED = "CONFIRMED";
    private static final String ASSIGNED = "ASSIGNED";
    private static final String WITHDRAWN = "WITHDRAWN";

    private final RaceEntryRepository raceEntryRepository;
    private final RaceRepository raceRepository;
    private final RegistrationRepository registrationRepository;
    private final TournamentRoundRepository tournamentRoundRepository;

    public RaceEntryService(
            RaceEntryRepository raceEntryRepository,
            RaceRepository raceRepository,
            RegistrationRepository registrationRepository,
            TournamentRoundRepository tournamentRoundRepository) {
        this.raceEntryRepository = raceEntryRepository;
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.tournamentRoundRepository = tournamentRoundRepository;
    }

    @Transactional
    public RaceEntry createRaceEntry(CreateRaceEntryRequest request) {
        Registration registration = registrationRepository
                .findByIdForUpdate(request.getRegistrationId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Registration does not exist."));

        if (!CONFIRMED.equals(registration.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only confirmed registrations can be assigned to a race.");
        }

        Race race = raceRepository.findByIdForUpdate(request.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."));

        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only draft races can receive entries.");
        }

        TournamentRound round = tournamentRoundRepository.findById(race.getRoundId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament round does not exist."));

        if (!registration.getTournamentId().equals(round.getTournamentId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration and race must belong to the same tournament.");
        }

        if (raceEntryRepository.existsByRaceIdAndRegistrationId(
                race.getRaceId(), registration.getRegistrationId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration already has an entry for this race.");
        }

        if (raceEntryRepository.existsActiveEntryByRoundAndRegistration(
                round.getRoundId(), registration.getRegistrationId(), WITHDRAWN)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration is already assigned to a race in this round.");
        }

        int laneNumber = raceEntryRepository
                .findMaxLaneNumber(race.getRaceId()) + 1;

        RaceEntry raceEntry = new RaceEntry();
        raceEntry.setRaceId(race.getRaceId());
        raceEntry.setRegistrationId(registration.getRegistrationId());
        raceEntry.setLaneNumber(laneNumber);
        raceEntry.setStatus(ASSIGNED);

        try {
            return raceEntryRepository.saveAndFlush(raceEntry);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race entry conflicts with an existing assignment.");
        }
    }
}
