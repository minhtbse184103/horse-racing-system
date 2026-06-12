package com.example.backend.service;

import java.util.List;

import com.example.backend.constant.EventStatus;
import com.example.backend.dto.request.CreateRaceEntryRequest;
import com.example.backend.entity.Race;
import com.example.backend.entity.RaceEntry;
import com.example.backend.entity.Registration;
import com.example.backend.entity.TournamentRound;
import com.example.backend.dto.response.RaceEntryCandidateResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.User;
import com.example.backend.entity.Tournament;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.TournamentRepository;
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
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final TournamentRepository tournamentRepository;

    public RaceEntryService(
            RaceEntryRepository raceEntryRepository,
            RaceRepository raceRepository,
            RegistrationRepository registrationRepository,
            TournamentRoundRepository tournamentRoundRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            TournamentRepository tournamentRepository) {
        this.raceEntryRepository = raceEntryRepository;
        this.raceRepository = raceRepository;
        this.registrationRepository = registrationRepository;
        this.tournamentRoundRepository = tournamentRoundRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.tournamentRepository = tournamentRepository;
    }

    @Transactional(readOnly = true)
    public List<RaceEntry> getRaceEntriesByRaceId(Integer raceId) {
        if (!raceRepository.existsById(raceId)) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Cuộc đua không tồn tại.");
        }

        return raceEntryRepository.findByRaceIdOrderByLaneNumberAsc(raceId);
    }

    @Transactional
    public RaceEntry createRaceEntry(CreateRaceEntryRequest request) {
        Registration registration = registrationRepository
                .findByIdForUpdate(request.getRegistrationId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Đơn đăng ký không tồn tại."));

        if (!CONFIRMED.equals(registration.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Chỉ có thể xếp đơn đăng ký đã được xác nhận vào cuộc đua.");
        }

        Race race = raceRepository.findByIdForUpdate(request.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cuộc đua không tồn tại."));

        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Chỉ cuộc đua đang ở trạng thái DRAFT mới có thể nhận suất tham gia.");
        }

        TournamentRound round = tournamentRoundRepository.findById(race.getRoundId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Vòng đấu không tồn tại."));

        if (!registration.getTournamentId().equals(round.getTournamentId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Đơn đăng ký và cuộc đua phải thuộc cùng một giải đấu.");
        }

        if (raceEntryRepository.existsByRaceIdAndRegistrationId(
                race.getRaceId(), registration.getRegistrationId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Đơn đăng ký đã có suất tham gia cuộc đua này.");
        }

        if (raceEntryRepository.existsActiveEntryByRoundAndRegistration(
                round.getRoundId(), registration.getRegistrationId(), WITHDRAWN)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Đơn đăng ký đã được xếp vào một cuộc đua trong vòng đấu này.");
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
                    "Suất tham gia cuộc đua xung đột với một phân công hiện có.");
        }
    }

    @Transactional(readOnly = true)
    public List<RaceEntryCandidateResponse> getAssignmentQueue() {
        return registrationRepository
                .findQualifiedAssignmentQueue(CONFIRMED, WITHDRAWN)
                .stream()
                .map(registration -> {
                    TournamentRound qualifiedRound = tournamentRoundRepository
                            .findByTournamentIdOrderByRoundOrderAsc(registration.getTournamentId())
                            .stream()
                            .filter(round -> Integer.valueOf(1).equals(round.getRoundOrder()))
                            .findFirst()
                            .orElse(null);

                    return mapCandidateResponse(registration, qualifiedRound);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RaceEntryCandidateResponse> getUnassignedByRound(Integer roundId) {
        TournamentRound round = tournamentRoundRepository.findById(roundId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Vòng đấu không tồn tại."));

        return registrationRepository
                .findUnassignedByRound(
                        round.getTournamentId(),
                        roundId,
                        CONFIRMED,
                        WITHDRAWN)
                .stream()
                .map(registration -> mapCandidateResponse(registration, round))
                .toList();
    }

    private RaceEntryCandidateResponse mapCandidateResponse(
            Registration registration,
            TournamentRound round) {
        Tournament tournament = tournamentRepository.findById(registration.getTournamentId()).orElse(null);
        Horse horse = horseRepository.findById(registration.getHorseId()).orElse(null);
        User owner = userRepository.findById(registration.getOwnerId()).orElse(null);
        User jockey = registration.getJockeyId() == null
                ? null
                : userRepository.findById(registration.getJockeyId()).orElse(null);

        return RaceEntryCandidateResponse.builder()
                .registrationId(registration.getRegistrationId())
                .tournamentId(registration.getTournamentId())
                .tournamentName(tournament != null ? tournament.getTournamentName() : null)
                .roundId(round != null ? round.getRoundId() : null)
                .roundName(round != null ? round.getRoundName() : null)
                .horseId(registration.getHorseId())
                .horseName(horse != null ? horse.getHorseName() : null)
                .ownerId(registration.getOwnerId())
                .ownerName(owner != null ? owner.getFullName() : null)
                .jockeyId(registration.getJockeyId())
                .jockeyName(jockey != null ? jockey.getFullName() : null)
                .registrationStatus(registration.getStatus())
                .build();
    }
}
