package com.example.backend.service;


import com.example.backend.dto.request.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.example.backend.exception.ApiException;
import com.example.backend.constant.EventStatus;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class TournamentService {
    private final RaceRepository raceRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final TournamentConditionRepository tournamentConditionRepository;
    private final TournamentRoundRepository tournamentRoundRepository;
    public Tournament getTournamentById(Integer id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại."));
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

        validateTournamentRules(
                request.getStartDate(),
                request.getEndDate(),
                request.getRegistrationDeadline(),
                request.getMinParticipants(),
                request.getMaxParticipants()
        );

        if (!tournamentConditionRepository.existsById(request.getConditionId())) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Điều kiện giải đấu không tồn tại."
            );
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản quản trị viên không tồn tại."));

        if (tournamentRepository.existsByLocationIgnoreCaseAndStartDateAndEndDateAndStatusNot(
                request.getLocation(),
                request.getStartDate(),
                request.getEndDate(),
                EventStatus.CANCELLED
        )) {
            throw new ApiException(HttpStatus.CONFLICT, "Đã tồn tại giải đấu tại địa điểm này với cùng ngày bắt đầu và ngày kết thúc.");
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
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại."));

    if (!EventStatus.DRAFT.equals(tournament.getStatus())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ có thể cập nhật giải đấu đang ở trạng thái DRAFT.");
    }

        validateTournamentRules(
                request.getStartDate(),
                request.getEndDate(),
                request.getRegistrationDeadline(),
                request.getMinParticipants(),
                request.getMaxParticipants()
        );

        if (!tournamentConditionRepository.existsById(request.getConditionId())) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "Điều kiện giải đấu không tồn tại."
            );
        }
    if (tournamentRepository.existsByLocationIgnoreCaseAndStartDateAndEndDateAndStatusNotAndTournamentIdNot(
            request.getLocation(),
            request.getStartDate(),
            request.getEndDate(),
            EventStatus.CANCELLED,
            id
    )) {
        throw new ApiException(HttpStatus.CONFLICT, "Đã tồn tại giải đấu tại địa điểm này với cùng ngày bắt đầu và ngày kết thúc.");
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
public Tournament openRegistration(Integer id) {
    Tournament tournament = tournamentRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại."));

    if (!EventStatus.DRAFT.equals(tournament.getStatus())) {
        throw new ApiException(HttpStatus.CONFLICT,
                "Chỉ có thể mở đăng ký cho giải đấu đang ở trạng thái DRAFT.");
    }

    LocalDate today = LocalDate.now();
    if (tournament.getStartDate() == null || tournament.getStartDate().isBefore(today)) {
        throw new ApiException(HttpStatus.BAD_REQUEST,
                "Ngày bắt đầu giải đấu không được là ngày đã qua.");
    }

    LocalDateTime now = LocalDateTime.now();
    if (tournament.getRegistrationDeadline() == null
            || tournament.getRegistrationDeadline().isBefore(now)) {
        throw new ApiException(HttpStatus.BAD_REQUEST,
                "Hạn đăng ký giải đấu không được là thời điểm đã qua.");
    }

    if (tournament.getMinParticipants() == null
            || tournament.getMaxParticipants() == null
            || tournament.getMinParticipants() <= 0
            || tournament.getMaxParticipants() <= 0
            || tournament.getMinParticipants() > tournament.getMaxParticipants()) {
        throw new ApiException(HttpStatus.CONFLICT,
                "Giới hạn số người tham gia giải đấu không hợp lệ.");
    }

    if (tournament.getConditionId() == null
            || !tournamentConditionRepository.existsById(tournament.getConditionId())) {
        throw new ApiException(HttpStatus.CONFLICT,
                "Điều kiện giải đấu không tồn tại.");
    }

    List<TournamentRound> rounds = tournamentRoundRepository
            .findByTournamentIdOrderByRoundOrderAsc(tournament.getTournamentId());
    if (!hasRequiredDraftRounds(rounds)) {
        throw new ApiException(HttpStatus.CONFLICT,
                "Giải đấu phải có đủ các vòng đấu DRAFT bắt buộc trước khi mở đăng ký.");
    }

    tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
    return tournamentRepository.save(tournament);
}

private boolean hasRequiredDraftRounds(List<TournamentRound> rounds) {
    if (rounds.size() != 3) {
        return false;
    }

    return isExpectedDraftRound(rounds.get(0), 1, "Qualified")
            && isExpectedDraftRound(rounds.get(1), 2, "Semi-Final")
            && isExpectedDraftRound(rounds.get(2), 3, "Final");
}

private boolean isExpectedDraftRound(TournamentRound round, int order, String name) {
    return Objects.equals(order, round.getRoundOrder())
            && Objects.equals(name, round.getRoundName())
            && EventStatus.DRAFT.equals(round.getStatus());
}

@Transactional
public Tournament cancelTournament(Integer id) {
    Tournament tournament = tournamentRepository.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Giải đấu không tồn tại."));

    if (!EventStatus.DRAFT.equals(tournament.getStatus())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ có thể hủy giải đấu đang ở trạng thái DRAFT.");
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
    private void validateTournamentRules(
            LocalDate startDate,
            LocalDate endDate,
            LocalDate registrationDeadline,
            Integer minParticipants,
            Integer maxParticipants
    ) {
        if (!startDate.isAfter(LocalDate.now())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày bắt đầu phải sau ngày hôm nay."
            );
        }

        if (startDate.isAfter(endDate)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày bắt đầu không được sau ngày kết thúc."
            );
        }

        if (!registrationDeadline.isBefore(startDate)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Hạn đăng ký phải trước ngày bắt đầu."
            );
        }

        if (minParticipants <= 2) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Số người tham gia tối thiểu phải lớn hơn 2."
            );
        }

        if (minParticipants > maxParticipants) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Số người tham gia tối thiểu không được lớn hơn số người tham gia tối đa."
            );
        }
    }
}
