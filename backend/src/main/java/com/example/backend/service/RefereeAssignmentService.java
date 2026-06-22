package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.dto.request.CreateRefereeAssignmentRequest;
import com.example.backend.dto.response.RefereeAssignmentResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.*;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RefereeAssignmentService {

    private final RefereeAssignmentRepository assignmentRepository;
    private final RaceRepository raceRepository;
    private final UserRepository userRepository;
    private final TournamentRoundRepository roundRepository;
    private final TournamentRepository tournamentRepository;

    public RefereeAssignmentService(
            RefereeAssignmentRepository assignmentRepository,
            RaceRepository raceRepository,
            UserRepository userRepository,
            TournamentRoundRepository roundRepository,
            TournamentRepository tournamentRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.raceRepository = raceRepository;
        this.userRepository = userRepository;
        this.roundRepository = roundRepository;
        this.tournamentRepository = tournamentRepository;
    }

    @Transactional
    public RefereeAssignment createAssignment(
            CreateRefereeAssignmentRequest request
    ) {
        Race race = raceRepository.findByIdForUpdate(request.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cuộc đua không tồn tại."
                ));

        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ có thể phân công trọng tài cho cuộc đua đang ở trạng thái DRAFT."
            );
        }

        TournamentRound round = roundRepository.findById(race.getRoundId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Vòng đấu không tồn tại."
                ));

        Tournament tournament = tournamentRepository
                .findById(round.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Giải đấu không tồn tại."
                ));

        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ có thể phân công trọng tài khi giải đấu đang mở đăng ký."
            );
        }

        User referee = userRepository.findById(request.getRefereeUserId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Trọng tài không tồn tại."
                ));

        if (referee.getRole() == null
                || !"REFEREE".equalsIgnoreCase(referee.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Người dùng được chọn không phải là trọng tài."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(referee.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Trọng tài được chọn không hoạt động."
            );
        }

        if (assignmentRepository.existsByRaceId(race.getRaceId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Cuộc đua này đã có trọng tài."
            );
        }

        if (assignmentRepository.existsOverlappingAssignment(
                referee.getUserID(),
                race.getStartTime(),
                race.getEndTime()
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Trọng tài đã được phân công cho một cuộc đua bị trùng thời gian."
            );
        }

        RefereeAssignment assignment = new RefereeAssignment();
        assignment.setRaceId(race.getRaceId());
        assignment.setRefereeUserId(referee.getUserID());
        assignment.setStatus("Assigned");

        return assignmentRepository.save(assignment);
    }
    @Transactional
    public RefereeAssignment replaceAssignment(
            Integer raceId,
            Integer refereeUserId
    ) {
        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cuộc đua không tồn tại."
                ));

        RefereeAssignment existing = assignmentRepository.findByRaceId(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cuộc đua chưa có phân công trọng tài."
                ));

        if (existing.getRefereeUserId().equals(refereeUserId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Trọng tài này đã được phân công cho cuộc đua."
            );
        }

        validateRaceCanReceiveAssignment(race);
        User referee = validateReferee(refereeUserId);

        if (assignmentRepository.existsOverlappingAssignment(
                referee.getUserID(),
                race.getStartTime(),
                race.getEndTime()
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Trọng tài đã được phân công cho một cuộc đua bị trùng thời gian."
            );
        }

        existing.setRefereeUserId(referee.getUserID());
        existing.setAssignedAt(LocalDateTime.now());
        existing.setStatus("Assigned");

        return assignmentRepository.save(existing);
    }

    private void validateRaceCanReceiveAssignment(Race race) {
        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ có thể phân công trọng tài cho cuộc đua đang ở trạng thái DRAFT."
            );
        }

        TournamentRound round = roundRepository.findById(race.getRoundId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Vòng đấu không tồn tại."
                ));

        Tournament tournament = tournamentRepository
                .findById(round.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Giải đấu không tồn tại."
                ));

        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ có thể phân công trọng tài khi giải đấu đang mở đăng ký."
            );
        }
    }

    private User validateReferee(Integer refereeUserId) {
        User referee = userRepository.findById(refereeUserId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Trọng tài không tồn tại."
                ));

        if (referee.getRole() == null
                || !"REFEREE".equalsIgnoreCase(referee.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Người dùng được chọn không phải là trọng tài."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(referee.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Trọng tài được chọn không hoạt động."
            );
        }

        return referee;
    }
    @Transactional
    public void removeAssignment(Integer raceId) {
        RefereeAssignment assignment = assignmentRepository.findByRaceId(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cuộc đua chưa có phân công trọng tài."
                ));

        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cuộc đua không tồn tại."
                ));

        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ có thể gỡ phân công trọng tài khỏi cuộc đua đang ở trạng thái DRAFT."
            );
        }

        assignmentRepository.delete(assignment);
    }

    public List<RefereeAssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public RefereeAssignmentResponse getByRaceId(Integer raceId) {
        RefereeAssignment assignment = assignmentRepository.findByRaceId(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cuộc đua chưa có phân công trọng tài."
                ));

        return toResponse(assignment);
    }

    public List<UserResponse> getActiveReferees() {
        return userRepository.findByStatusAndRoleRoleNameOrderByUpdatedAtDesc(
                "ACTIVE",
                "REFEREE"
        )
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getUserID(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getStatus(),
                user.getRole().getRoleName()
        );
    }

    private RefereeAssignmentResponse toResponse(
            RefereeAssignment assignment
    ) {
        Race race = raceRepository.findById(assignment.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cuộc đua được phân công không tồn tại."
                ));

        TournamentRound round = roundRepository.findById(race.getRoundId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Vòng đấu được phân công không tồn tại."
                ));

        Tournament tournament = tournamentRepository.findById(round.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Giải đấu được phân công không tồn tại."
                ));

        User referee = userRepository.findById(assignment.getRefereeUserId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Trọng tài được phân công không tồn tại."
                ));

        return RefereeAssignmentResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .assignmentStatus(assignment.getStatus())
                .assignedAt(assignment.getAssignedAt())
                .raceId(race.getRaceId())
                .raceName(race.getRaceName())
                .raceOrder(race.getRaceOrder())
                .distance(race.getDistance())
                .startTime(race.getStartTime())
                .endTime(race.getEndTime())
                .raceStatus(race.getStatus())
                .roundId(round.getRoundId())
                .roundName(round.getRoundName())
                .roundOrder(round.getRoundOrder())
                .tournamentId(tournament.getTournamentId())
                .tournamentName(tournament.getTournamentName())
                .tournamentStatus(tournament.getStatus())
                .refereeUserId(referee.getUserID())
                .refereeName(referee.getFullName())
                .refereeEmail(referee.getEmail())
                .build();
    }
}
