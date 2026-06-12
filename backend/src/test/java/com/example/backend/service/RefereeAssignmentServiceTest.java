package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.entity.Race;
import com.example.backend.entity.RefereeAssignment;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentRound;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RefereeAssignmentRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.TournamentRoundRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefereeAssignmentServiceTest {

    @Mock
    private RefereeAssignmentRepository assignmentRepository;
    @Mock
    private RaceRepository raceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TournamentRoundRepository roundRepository;
    @Mock
    private TournamentRepository tournamentRepository;

    private RefereeAssignmentService service;

    @BeforeEach
    void setUp() {
        service = new RefereeAssignmentService(
                assignmentRepository,
                raceRepository,
                userRepository,
                roundRepository,
                tournamentRepository
        );
    }

    @Test
    void replaceAssignmentUpdatesExistingAssignment() {
        Race race = validRace();
        RefereeAssignment existing = existingAssignment();
        User replacement = activeReferee(22);
        mockValidReplacement(race, existing, replacement);
        when(assignmentRepository.existsOverlappingAssignment(
                replacement.getUserID(),
                race.getStartTime(),
                race.getEndTime()
        )).thenReturn(false);
        when(assignmentRepository.save(existing)).thenReturn(existing);

        RefereeAssignment result = service.replaceAssignment(10, 22);

        assertSame(existing, result);
        assertEquals(22, result.getRefereeUserId());
        assertEquals("Assigned", result.getStatus());
        verify(assignmentRepository).save(existing);
        verify(assignmentRepository, never()).delete(any());
    }

    @Test
    void replaceAssignmentRejectsOverlappingReferee() {
        Race race = validRace();
        RefereeAssignment existing = existingAssignment();
        User replacement = activeReferee(22);
        mockValidReplacement(race, existing, replacement);
        when(assignmentRepository.existsOverlappingAssignment(
                replacement.getUserID(),
                race.getStartTime(),
                race.getEndTime()
        )).thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.replaceAssignment(10, 22)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(assignmentRepository, never()).save(any());
    }

    private void mockValidReplacement(
            Race race,
            RefereeAssignment existing,
            User replacement
    ) {
        TournamentRound round = new TournamentRound();
        round.setRoundId(30);
        round.setTournamentId(40);

        Tournament tournament = new Tournament();
        tournament.setTournamentId(40);
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);

        when(raceRepository.findByIdForUpdate(10)).thenReturn(Optional.of(race));
        when(assignmentRepository.findByRaceId(10)).thenReturn(Optional.of(existing));
        when(roundRepository.findById(30)).thenReturn(Optional.of(round));
        when(tournamentRepository.findById(40)).thenReturn(Optional.of(tournament));
        when(userRepository.findById(22)).thenReturn(Optional.of(replacement));
    }

    private Race validRace() {
        Race race = new Race();
        race.setRaceId(10);
        race.setRoundId(30);
        race.setStatus(EventStatus.DRAFT);
        race.setStartTime(LocalDateTime.of(2026, 12, 10, 9, 0));
        race.setEndTime(LocalDateTime.of(2026, 12, 10, 10, 0));
        return race;
    }

    private RefereeAssignment existingAssignment() {
        RefereeAssignment assignment = new RefereeAssignment();
        assignment.setAssignmentId(50);
        assignment.setRaceId(10);
        assignment.setRefereeUserId(21);
        assignment.setStatus("Assigned");
        return assignment;
    }

    private User activeReferee(Integer userId) {
        Role role = new Role();
        role.setRoleName("REFEREE");

        User referee = new User();
        referee.setUserID(userId);
        referee.setRole(role);
        referee.setStatus("ACTIVE");
        return referee;
    }
}
