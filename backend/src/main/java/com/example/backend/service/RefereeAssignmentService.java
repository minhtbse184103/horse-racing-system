package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RefereeAssignmentStatus;
import com.example.backend.dto.request.CreateRefereeAssignmentRequest;
import com.example.backend.dto.response.RefereeAssignmentResponse;
import com.example.backend.dto.response.UserResponse;
import com.example.backend.entity.*;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class RefereeAssignmentService {

    private static final Set<String> ASSIGNABLE_RACE_STATUSES =
            Set.of(
                    EventStatus.OPEN_FOR_REGISTRATION,
                    EventStatus.REGISTRATION_CLOSED
            );

    private final RefereeAssignmentRepository assignmentRepository;
    private final RaceRepository raceRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;

    public RefereeAssignmentService(
            RefereeAssignmentRepository assignmentRepository,
            RaceRepository raceRepository,
            TournamentRepository tournamentRepository,
            UserRepository userRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.raceRepository = raceRepository;
        this.tournamentRepository = tournamentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RefereeAssignmentResponse createAssignment(
            CreateRefereeAssignmentRequest request,
            String adminEmail
    ) {
        getAdmin(adminEmail);
        Race race = raceRepository
                .findByIdForUpdate(request.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        validateRaceCanReceiveAssignment(race);

        if (assignmentRepository.existsByRaceId(race.getRaceId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race already has an assigned referee."
            );
        }

        User referee = validateReferee(request.getRefereeUserId());

        validateNoScheduleConflict(
                referee.getUserID(),
                race,
                race.getRaceId()
        );

        RefereeAssignment assignment = new RefereeAssignment();
        assignment.setRaceId(race.getRaceId());
        assignment.setRefereeUserId(referee.getUserID());
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setStatus(
                RefereeAssignmentStatus.ASSIGNED
        );

        try {
            return toResponse(
                    assignmentRepository.saveAndFlush(assignment)
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race already has a referee assignment."
            );
        }
    }

    @Transactional
    public RefereeAssignmentResponse replaceAssignment(
            Integer raceId,
            Integer refereeUserId,
            String adminEmail
    ) {
        getAdmin(adminEmail);
        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        validateRaceCanReceiveAssignment(race);

        RefereeAssignment assignment = assignmentRepository
                .findByRaceId(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not have a referee assignment."
                ));

        if (assignment.getRefereeUserId().equals(refereeUserId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Selected referee is already assigned to this race."
            );
        }

        User referee = validateReferee(refereeUserId);

        validateNoScheduleConflict(
                referee.getUserID(),
                race,
                raceId
        );

        assignment.setRefereeUserId(referee.getUserID());
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setStatus(
                RefereeAssignmentStatus.ASSIGNED
        );

        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public void removeAssignment(Integer raceId, String adminEmail) {
        getAdmin(adminEmail);
        Race race = raceRepository.findByIdForUpdate(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not exist."
                ));

        validateRaceCanReceiveAssignment(race);

        RefereeAssignment assignment = assignmentRepository
                .findByRaceId(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not have a referee assignment."
                ));

        assignmentRepository.delete(assignment);
    }

    @Transactional(readOnly = true)
    public List<RefereeAssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RefereeAssignmentResponse getByRaceId(
            Integer raceId
    ) {
        RefereeAssignment assignment = assignmentRepository
                .findByRaceId(raceId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Race does not have a referee assignment."
                ));

        return toResponse(assignment);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getActiveReferees() {
        return userRepository
                .findByStatusAndRoleRoleNameOrderByUpdatedAtDesc(
                        "ACTIVE",
                        "REFEREE"
                )
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    private void getAdmin(String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated administrator does not exist."
                ));

        if (admin.getRole() == null
                || !"ADMIN".equalsIgnoreCase(
                admin.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Only administrators can manage referee assignments."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(admin.getStatus())) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Administrator account is not active."
            );
        }
    }

    private void validateRaceCanReceiveAssignment(Race race) {
        if (!ASSIGNABLE_RACE_STATUSES.contains(race.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race is not available for referee assignment."
            );
        }

        if (!LocalDateTime.now().isBefore(
                race.getRaceStartTime())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Referee cannot be changed after the race starts."
            );
        }

        if (race.getRaceEndTime() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Race end time is required for referee assignment."
            );
        }

        Tournament tournament = tournamentRepository
                .findById(race.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Tournament does not exist."
                ));

        if (EventStatus.CANCELLED.equals(tournament.getStatus())
                || EventStatus.COMPLETED.equals(tournament.getStatus())
                || EventStatus.IN_PROGRESS.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament does not allow referee assignment."
            );
        }
    }

    private User validateReferee(Integer refereeUserId) {
        User referee = userRepository.findById(refereeUserId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Referee does not exist."
                ));

        if (referee.getRole() == null
                || !"REFEREE".equalsIgnoreCase(
                referee.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Selected user is not a referee."
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(referee.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Selected referee is not active."
            );
        }

        return referee;
    }

    private void validateNoScheduleConflict(
            Integer refereeUserId,
            Race race,
            Integer excludedRaceId
    ) {
        boolean conflict =
                assignmentRepository.existsOverlappingAssignment(
                        refereeUserId,
                        excludedRaceId,
                        race.getRaceStartTime(),
                        race.getRaceEndTime(),
                        RefereeAssignmentStatus.ASSIGNED,
                        EventStatus.CANCELLED
                );

        if (conflict) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Referee is already assigned to an overlapping race."
            );
        }
    }

    private RefereeAssignmentResponse toResponse(
            RefereeAssignment assignment
    ) {
        Race race = raceRepository
                .findById(assignment.getRaceId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Assigned race does not exist."
                ));

        Tournament tournament = tournamentRepository
                .findById(race.getTournamentId())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Assigned Tournament does not exist."
                ));

        User referee = userRepository
                .findById(assignment.getRefereeUserId())
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
                .trackName(race.getTrackName())
                .raceOrder(race.getRaceOrder())
                .distance(race.getDistance())
                .maxRunners(race.getMaxRunners())
                .raceStartTime(race.getRaceStartTime())
                .raceEndTime(race.getRaceEndTime())
                .raceStatus(race.getStatus())

                .tournamentId(tournament.getTournamentId())
                .tournamentName(tournament.getTournamentName())
                .venue(tournament.getVenue())
                .tournamentStatus(tournament.getStatus())

                .refereeUserId(referee.getUserID())
                .refereeName(referee.getUsername())
                .refereeEmail(referee.getEmail())
                .build();
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
}
