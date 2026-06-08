package com.example.backend.service;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.example.backend.exception.ApiException;
import com.example.backend.constant.EventStatus;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class TournamentService {
    private final RaceRepository raceRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final TournamentConditionRepository tournamentConditionRepository;
    private final TournamentRoundRepository tournamentRoundRepository;
    public Tournament getTournamentById(Integer id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));
    }

    public TournamentService(
            TournamentRepository tournamentRepository,
            RaceRepository raceRepository,
            UserRepository userRepository,
            TournamentConditionRepository tournamentConditionRepository,
            TournamentRoundRepository tournamentRoundRepository
    ) {
        this.tournamentRepository = tournamentRepository;
        this.raceRepository = raceRepository;
        this.userRepository = userRepository;
        this.tournamentConditionRepository = tournamentConditionRepository;
        this.tournamentRoundRepository = tournamentRoundRepository;
    }

    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    @Transactional
    public Tournament createTournament(CreateTournamentRequest request, String adminEmail) {
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Start date cannot be after end date.");
        }

        if (request.getRegistrationDeadline().isAfter(request.getStartDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Registration deadline cannot be after start date.");
        }
        if (request.getMinParticipants() > request.getMaxParticipants()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Minimum participants cannot be greater than maximum participants."
            );
        }

        if (!tournamentConditionRepository.existsById(request.getConditionId())) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Tournament condition does not exist."
            );
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Admin account does not exist."));

        if (tournamentRepository.existsByLocationIgnoreCaseAndStartDateAndEndDateAndStatusNot(
                request.getLocation(),
                request.getStartDate(),
                request.getEndDate(),
                EventStatus.CANCELLED
        )) {
            throw new ApiException(HttpStatus.CONFLICT, "Tournament already exists at this location with the same start date and end date.");
        }

        Tournament tournament = new Tournament();
        tournament.setTournamentName(request.getTournamentName());
        tournament.setLocation(request.getLocation());
        tournament.setStartDate(request.getStartDate());
        tournament.setEndDate(request.getEndDate());
        tournament.setRegistrationDeadline(request.getRegistrationDeadline().atTime(23, 59, 59));
        tournament.setMinParticipants(request.getMinParticipants());
        tournament.setMaxParticipants(request.getMaxParticipants());
        tournament.setConditionId(request.getConditionId());
        tournament.setStatus(EventStatus.DRAFT);
        tournament.setCreatedBy(admin.getUserID());

        Tournament savedTournament = tournamentRepository.save(tournament);

        createFixedRounds(savedTournament.getTournamentId());

        return savedTournament;
    }

    public Tournament updateTournament(Integer id, UpdateTournamentRequest request) {
    Tournament tournament = tournamentRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));

    if (!EventStatus.DRAFT.equals(tournament.getStatus())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft tournaments can be updated.");
    }

    if (request.getStartDate().isAfter(request.getEndDate())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Start date cannot be after end date.");
    }

    if (request.getRegistrationDeadline().isAfter(request.getStartDate())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Registration deadline cannot be after start date.");
    }
        if (request.getMinParticipants() > request.getMaxParticipants()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Minimum participants cannot be greater than maximum participants."
            );
        }

        if (!tournamentConditionRepository.existsById(request.getConditionId())) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Tournament condition does not exist."
            );
        }
    if (tournamentRepository.existsByLocationIgnoreCaseAndStartDateAndEndDateAndStatusNotAndTournamentIdNot(
            request.getLocation(),
            request.getStartDate(),
            request.getEndDate(),
            EventStatus.CANCELLED,
            id
    )) {
        throw new ApiException(HttpStatus.CONFLICT, "Tournament already exists at this location with the same start date and end date.");
    }

    tournament.setTournamentName(request.getTournamentName());
    tournament.setLocation(request.getLocation());
    tournament.setStartDate(request.getStartDate());
    tournament.setEndDate(request.getEndDate());
    tournament.setRegistrationDeadline(request.getRegistrationDeadline().atTime(23, 59, 59));
        tournament.setMinParticipants(request.getMinParticipants());
        tournament.setMaxParticipants(request.getMaxParticipants());
        tournament.setConditionId(request.getConditionId());
    return tournamentRepository.save(tournament);
}
@Transactional
public Tournament cancelTournament(Integer id) {
    Tournament tournament = tournamentRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));

    if (!EventStatus.DRAFT.equals(tournament.getStatus())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Only draft tournaments can be cancelled.");
    }

    List<TournamentRound> rounds = tournamentRoundRepository
            .findByTournamentIdOrderByRoundOrderAsc(tournament.getTournamentId());

    List<Integer> roundIds = rounds.stream()
            .map(TournamentRound::getRoundId)
            .toList();

    List<Race> races = roundIds.isEmpty()
            ? List.of()
            : raceRepository.findByRoundIdIn(roundIds);

    for (Race race : races) {
        race.setStatus(EventStatus.CANCELLED);
    }

    for (TournamentRound round : rounds) {
        round.setStatus(EventStatus.CANCELLED);
    }

    raceRepository.saveAll(races);
    tournamentRoundRepository.saveAll(rounds);

    tournament.setStatus(EventStatus.CANCELLED);

    return tournamentRepository.save(tournament);
}
    private void createFixedRounds(Integer tournamentId) {
        TournamentRound qualified = new TournamentRound();
        qualified.setTournamentId(tournamentId);
        qualified.setRoundName("Qualified");
        qualified.setRoundOrder(1);
        qualified.setStatus(EventStatus.DRAFT);

        TournamentRound semiFinal = new TournamentRound();
        semiFinal.setTournamentId(tournamentId);
        semiFinal.setRoundName("Semi-Final");
        semiFinal.setRoundOrder(2);
        semiFinal.setStatus(EventStatus.DRAFT);

        TournamentRound finalRound = new TournamentRound();
        finalRound.setTournamentId(tournamentId);
        finalRound.setRoundName("Final");
        finalRound.setRoundOrder(3);
        finalRound.setStatus(EventStatus.DRAFT);

        tournamentRoundRepository.saveAll(List.of(
                qualified,
                semiFinal,
                finalRound
        ));
    }
}
