package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.RefereeAssignmentStatus;
import com.example.backend.dto.request.CreateRefereeAssignmentRequest;
import com.example.backend.dto.response.RefereeAssignmentResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RefereeAssignment;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RefereeAssignmentRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefereeAssignmentServiceTest {

    @Mock private RefereeAssignmentRepository assignmentRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private TournamentRepository tournamentRepository;
    @Mock private UserRepository userRepository;

    private RefereeAssignmentService service;

    @BeforeEach
    void setUp() {
        service = new RefereeAssignmentService(
                assignmentRepository,
                raceRepository,
                tournamentRepository,
                userRepository
        );
    }

    private User activeAdmin() {
        Role role = new Role();
        role.setRoleName("ADMIN");
        User admin = new User();
        admin.setUserID(99);
        admin.setEmail("admin@example.com");
        admin.setRole(role);
        admin.setStatus("ACTIVE");
        return admin;
    }

    private void stubAdmin() {
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
    }

    @Test
    void createAssignmentUsesDirectTournamentRaceRelationship() {
        Race race = futureRace();
        Tournament tournament = openTournament();
        User referee = activeReferee(22);
        CreateRefereeAssignmentRequest request = request(10, 22);
        stubAdmin();
        when(raceRepository.findByIdForUpdate(10))
                .thenReturn(Optional.of(race));
        when(tournamentRepository.findById(40))
                .thenReturn(Optional.of(tournament));
        when(assignmentRepository.existsByRaceId(10)).thenReturn(false);
        when(userRepository.findById(22)).thenReturn(Optional.of(referee));
        when(assignmentRepository.existsOverlappingAssignment(
                22,
                10,
                race.getRaceStartTime(),
                race.getRaceEndTime(),
                RefereeAssignmentStatus.ASSIGNED,
                EventStatus.CANCELLED
        )).thenReturn(false);
        when(assignmentRepository.saveAndFlush(any(RefereeAssignment.class)))
                .thenAnswer(invocation -> {
                    RefereeAssignment saved = invocation.getArgument(0);
                    saved.setAssignmentId(50);
                    return saved;
                });
        stubResponseLookups(race, tournament, referee);

        RefereeAssignmentResponse response = service.createAssignment(
                request, "admin@example.com"
        );

        assertEquals(50, response.getAssignmentId());
        assertEquals(10, response.getRaceId());
        assertEquals(40, response.getTournamentId());
        assertEquals(22, response.getRefereeUserId());
        assertEquals(RefereeAssignmentStatus.ASSIGNED,
                response.getAssignmentStatus());
        assertNotNull(response.getAssignedAt());
    }

    @Test
    void createAssignmentRejectsRaceThatAlreadyHasReferee() {
        Race race = futureRace();
        stubAdmin();
        when(raceRepository.findByIdForUpdate(10))
                .thenReturn(Optional.of(race));
        when(tournamentRepository.findById(40))
                .thenReturn(Optional.of(openTournament()));
        when(assignmentRepository.existsByRaceId(10)).thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createAssignment(request(10, 22), "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(userRepository, never()).findById(any());
        verify(assignmentRepository, never()).saveAndFlush(any());
    }

    @Test
    void createAssignmentRejectsOverlappingSchedule() {
        Race race = futureRace();
        User referee = activeReferee(22);
        stubAdmin();
        when(raceRepository.findByIdForUpdate(10))
                .thenReturn(Optional.of(race));
        when(tournamentRepository.findById(40))
                .thenReturn(Optional.of(openTournament()));
        when(assignmentRepository.existsByRaceId(10)).thenReturn(false);
        when(userRepository.findById(22)).thenReturn(Optional.of(referee));
        when(assignmentRepository.existsOverlappingAssignment(
                22,
                10,
                race.getRaceStartTime(),
                race.getRaceEndTime(),
                RefereeAssignmentStatus.ASSIGNED,
                EventStatus.CANCELLED
        )).thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createAssignment(request(10, 22), "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(assignmentRepository, never()).saveAndFlush(any());
    }

    @Test
    void createAssignmentRejectsNonAdmin() {
        User nonAdmin = new User();
        Role ownerRole = new Role();
        ownerRole.setRoleName("OWNER");
        nonAdmin.setRole(ownerRole);
        nonAdmin.setStatus("ACTIVE");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(nonAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createAssignment(request(10, 22), "owner@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(raceRepository, never()).findByIdForUpdate(any());
        verify(assignmentRepository, never()).saveAndFlush(any());
    }

    @Test
    void replaceAssignmentUpdatesExistingAssignment() {
        Race race = futureRace();
        Tournament tournament = openTournament();
        User referee = activeReferee(22);
        RefereeAssignment assignment = assignment(21);
        stubAdmin();
        when(raceRepository.findByIdForUpdate(10))
                .thenReturn(Optional.of(race));
        when(tournamentRepository.findById(40))
                .thenReturn(Optional.of(tournament));
        when(assignmentRepository.findByRaceId(10))
                .thenReturn(Optional.of(assignment));
        when(userRepository.findById(22)).thenReturn(Optional.of(referee));
        when(assignmentRepository.existsOverlappingAssignment(
                22,
                10,
                race.getRaceStartTime(),
                race.getRaceEndTime(),
                RefereeAssignmentStatus.ASSIGNED,
                EventStatus.CANCELLED
        )).thenReturn(false);
        when(assignmentRepository.save(assignment)).thenReturn(assignment);
        stubResponseLookups(race, tournament, referee);

        RefereeAssignmentResponse response = service.replaceAssignment(
                10, 22, "admin@example.com"
        );

        assertEquals(22, assignment.getRefereeUserId());
        assertEquals(22, response.getRefereeUserId());
        assertEquals(RefereeAssignmentStatus.ASSIGNED, assignment.getStatus());
    }

    @Test
    void replaceAssignmentRejectsNonAdmin() {
        User nonAdmin = new User();
        Role jockeyRole = new Role();
        jockeyRole.setRoleName("JOCKEY");
        nonAdmin.setRole(jockeyRole);
        nonAdmin.setStatus("ACTIVE");
        when(userRepository.findByEmail("jockey@example.com"))
                .thenReturn(Optional.of(nonAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.replaceAssignment(10, 22, "jockey@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(raceRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void removeAssignmentDeletesExistingAssignment() {
        Race race = futureRace();
        RefereeAssignment assignment = assignment(21);
        stubAdmin();
        when(raceRepository.findByIdForUpdate(10))
                .thenReturn(Optional.of(race));
        when(tournamentRepository.findById(40))
                .thenReturn(Optional.of(openTournament()));
        when(assignmentRepository.findByRaceId(10))
                .thenReturn(Optional.of(assignment));

        service.removeAssignment(10, "admin@example.com");

        verify(assignmentRepository).delete(assignment);
    }

    @Test
    void removeAssignmentRejectsInactiveAdmin() {
        User inactiveAdmin = activeAdmin();
        inactiveAdmin.setStatus("INACTIVE");
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(inactiveAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.removeAssignment(10, "admin@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verify(raceRepository, never()).findByIdForUpdate(any());
        verify(assignmentRepository, never()).delete(any());
    }

    private CreateRefereeAssignmentRequest request(Integer raceId, Integer refereeId) {
        CreateRefereeAssignmentRequest request = new CreateRefereeAssignmentRequest();
        request.setRaceId(raceId);
        request.setRefereeUserId(refereeId);
        return request;
    }

    private Race futureRace() {
        Race race = new Race();
        race.setRaceId(10);
        race.setTournamentId(40);
        race.setRaceName("Qualifier 1");
        race.setTrackName("Bangkok Track");
        race.setRaceOrder(1);
        race.setDistance(1200);
        race.setMaxRunners(12);
        race.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        race.setRaceStartTime(LocalDateTime.now().plusDays(2));
        race.setRaceEndTime(LocalDateTime.now().plusDays(2).plusHours(1));
        return race;
    }

    private Tournament openTournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(40);
        tournament.setTournamentName("Summer Championship");
        tournament.setVenue("Bangkok Track");
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        return tournament;
    }

    private User activeReferee(Integer userId) {
        Role role = new Role();
        role.setRoleName("REFEREE");
        User referee = new User();
        referee.setUserID(userId);
        referee.setUsername("Referee " + userId);
        referee.setEmail("referee" + userId + "@example.com");
        referee.setStatus("ACTIVE");
        referee.setRole(role);
        return referee;
    }

    private RefereeAssignment assignment(Integer refereeId) {
        RefereeAssignment assignment = new RefereeAssignment();
        assignment.setAssignmentId(50);
        assignment.setRaceId(10);
        assignment.setRefereeUserId(refereeId);
        assignment.setStatus(RefereeAssignmentStatus.ASSIGNED);
        assignment.setAssignedAt(LocalDateTime.now());
        return assignment;
    }

    private void stubResponseLookups(
            Race race,
            Tournament tournament,
            User referee
    ) {
        when(raceRepository.findById(race.getRaceId()))
                .thenReturn(Optional.of(race));
        when(tournamentRepository.findById(tournament.getTournamentId()))
                .thenReturn(Optional.of(tournament));
        when(userRepository.findById(referee.getUserID()))
                .thenReturn(Optional.of(referee));
    }
}
