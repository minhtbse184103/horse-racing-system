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
                        "Race does not exist."
                ));

        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Referees can only be assigned to draft races."
            );
        }

        TournamentRound round = roundRepository.findById(race.getRoundId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament round does not exist."
                ));

        Tournament tournament = tournamentRepository
                .findById(round.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Referees can only be assigned while registration is open."
            );
        }

        User referee = userRepository.findById(request.getRefereeUserId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Referee does not exist."
                ));

        if (referee.getRole() == null
                || !"REFEREE".equalsIgnoreCase(referee.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Selected user is not a referee."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(referee.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Selected referee is not active."
            );
        }

        if (assignmentRepository.existsByRaceId(race.getRaceId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "This race already has a referee."
            );
        }

        if (assignmentRepository.existsOverlappingAssignment(
                referee.getUserID(),
                race.getStartTime(),
                race.getEndTime()
        )) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Referee is already assigned to an overlapping race."
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
        RefereeAssignment existing = assignmentRepository.findByRaceId(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not have a referee assignment."
                ));

        if (existing.getRefereeUserId().equals(refereeUserId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "This referee is already assigned to the race."
            );
        }

        existing.setStatus("Cancelled");
        assignmentRepository.save(existing);

        CreateRefereeAssignmentRequest request = new CreateRefereeAssignmentRequest();
        request.setRaceId(raceId);
        request.setRefereeUserId(refereeUserId);

        assignmentRepository.delete(existing);
        assignmentRepository.flush();

        return createAssignment(request);
    }
    @Transactional
    public void removeAssignment(Integer raceId) {
        RefereeAssignment assignment = assignmentRepository.findByRaceId(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not have a referee assignment."
                ));

        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        if (!EventStatus.DRAFT.equals(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Referee assignment can only be removed from draft races."
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
                        "Race does not have a referee assignment."
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
                user.getEmail(),
                user.getFullName(),
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
                        "Assigned race does not exist."
                ));

        TournamentRound round = roundRepository.findById(race.getRoundId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Assigned tournament round does not exist."
                ));

        Tournament tournament = tournamentRepository.findById(round.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Assigned tournament does not exist."
                ));

        User referee = userRepository.findById(assignment.getRefereeUserId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Assigned referee does not exist."
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
