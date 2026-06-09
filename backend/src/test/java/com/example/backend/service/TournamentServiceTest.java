package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentRound;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.TournamentRoundRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TournamentServiceTest {

    @Mock
    private TournamentRepository tournamentRepository;
    @Mock
    private RaceRepository raceRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TournamentConditionRepository tournamentConditionRepository;
    @Mock
    private TournamentRoundRepository tournamentRoundRepository;

    private TournamentService tournamentService;

    @BeforeEach
    void setUp() {
        tournamentService = new TournamentService(
                tournamentRepository,
                raceRepository,
                userRepository,
                tournamentConditionRepository,
                tournamentRoundRepository);
    }

    @Test
    void openRegistrationChangesValidDraftTournamentStatus() {
        Tournament tournament = validDraftTournament();
        when(tournamentRepository.findById(1)).thenReturn(Optional.of(tournament));
        when(tournamentConditionRepository.existsById(1)).thenReturn(true);
        when(tournamentRoundRepository.findByTournamentIdOrderByRoundOrderAsc(1))
                .thenReturn(requiredDraftRounds());
        when(tournamentRepository.save(tournament)).thenReturn(tournament);

        Tournament result = tournamentService.openRegistration(1);

        assertEquals(EventStatus.OPEN_FOR_REGISTRATION, result.getStatus());
        verify(tournamentRepository).save(tournament);
    }

    @Test
    void openRegistrationRejectsNonDraftTournament() {
        Tournament tournament = validDraftTournament();
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        when(tournamentRepository.findById(1)).thenReturn(Optional.of(tournament));

        ApiException exception = assertThrows(ApiException.class,
                () -> tournamentService.openRegistration(1));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(tournamentRepository, never()).save(tournament);
    }

    @Test
    void openRegistrationRejectsPassedDeadline() {
        Tournament tournament = validDraftTournament();
        tournament.setRegistrationDeadline(LocalDateTime.now().minusMinutes(1));
        when(tournamentRepository.findById(1)).thenReturn(Optional.of(tournament));

        ApiException exception = assertThrows(ApiException.class,
                () -> tournamentService.openRegistration(1));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(tournamentRepository, never()).save(tournament);
    }

    @Test
    void openRegistrationRejectsPassedStartDate() {
        Tournament tournament = validDraftTournament();
        tournament.setStartDate(LocalDate.now().minusDays(1));
        when(tournamentRepository.findById(1)).thenReturn(Optional.of(tournament));

        ApiException exception = assertThrows(ApiException.class,
                () -> tournamentService.openRegistration(1));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(tournamentRepository, never()).save(tournament);
    }

    @Test
    void openRegistrationRejectsMissingCondition() {
        Tournament tournament = validDraftTournament();
        when(tournamentRepository.findById(1)).thenReturn(Optional.of(tournament));
        when(tournamentConditionRepository.existsById(1)).thenReturn(false);

        ApiException exception = assertThrows(ApiException.class,
                () -> tournamentService.openRegistration(1));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(tournamentRepository, never()).save(tournament);
    }

    @Test
    void openRegistrationRejectsInvalidRounds() {
        Tournament tournament = validDraftTournament();
        when(tournamentRepository.findById(1)).thenReturn(Optional.of(tournament));
        when(tournamentConditionRepository.existsById(1)).thenReturn(true);
        when(tournamentRoundRepository.findByTournamentIdOrderByRoundOrderAsc(1))
                .thenReturn(List.of(round(1, "Qualified"), round(2, "Semi-Final")));

        ApiException exception = assertThrows(ApiException.class,
                () -> tournamentService.openRegistration(1));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(tournamentRepository, never()).save(tournament);
    }

    private Tournament validDraftTournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(1);
        tournament.setStatus(EventStatus.DRAFT);
        tournament.setStartDate(LocalDate.now().plusDays(10));
        tournament.setRegistrationDeadline(LocalDateTime.now().plusDays(5));
        tournament.setMinParticipants(4);
        tournament.setMaxParticipants(12);
        tournament.setConditionId(1);
        return tournament;
    }

    private List<TournamentRound> requiredDraftRounds() {
        return List.of(
                round(1, "Qualified"),
                round(2, "Semi-Final"),
                round(3, "Final"));
    }

    private TournamentRound round(int order, String name) {
        TournamentRound round = new TournamentRound();
        round.setTournamentId(1);
        round.setRoundOrder(order);
        round.setRoundName(name);
        round.setStatus(EventStatus.DRAFT);
        return round;
    }
}
