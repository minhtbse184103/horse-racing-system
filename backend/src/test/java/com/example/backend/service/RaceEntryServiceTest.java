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
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceEntryServiceTest {

    @Mock
    private RaceEntryRepository raceEntryRepository;
    @Mock
    private RaceRepository raceRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private TournamentRoundRepository tournamentRoundRepository;
    @Mock
    private HorseRepository horseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TournamentRepository tournamentRepository;

    private RaceEntryService service;

    @BeforeEach
    void setUp() {
        service = new RaceEntryService(
                raceEntryRepository,
                raceRepository,
                registrationRepository,
                tournamentRoundRepository,
                horseRepository,
                userRepository,
                tournamentRepository);
    }

    @Test
    void createRaceEntryAssignsNextLaneToConfirmedRegistration() {
        CreateRaceEntryRequest request = request();
        mockValidAssignment(request);
        when(raceEntryRepository.findMaxLaneNumber(10)).thenReturn(2);
        when(raceEntryRepository.saveAndFlush(any(RaceEntry.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RaceEntry result = service.createRaceEntry(request);

        assertEquals(3, result.getLaneNumber());
        assertEquals("ASSIGNED", result.getStatus());
        verify(raceRepository).findByIdForUpdate(10);
        verify(registrationRepository).findByIdForUpdate(20);
    }

    @Test
    void getRaceEntriesByRaceIdReturnsEntriesInRepositoryOrder() {
        RaceEntry first = new RaceEntry();
        first.setRaceId(10);
        first.setLaneNumber(1);
        RaceEntry second = new RaceEntry();
        second.setRaceId(10);
        second.setLaneNumber(2);
        when(raceRepository.existsById(10)).thenReturn(true);
        when(raceEntryRepository.findByRaceIdOrderByLaneNumberAsc(10))
                .thenReturn(List.of(first, second));

        var entries = service.getRaceEntriesByRaceId(10);

        assertEquals(2, entries.size());
        assertEquals(1, entries.get(0).getLaneNumber());
        assertEquals(2, entries.get(1).getLaneNumber());
    }

    @Test
    void getRaceEntriesByRaceIdRejectsMissingRace() {
        when(raceRepository.existsById(99)).thenReturn(false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getRaceEntriesByRaceId(99));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(raceEntryRepository, never()).findByRaceIdOrderByLaneNumberAsc(any());
    }

    @Test
    void createRaceEntryRejectsNonConfirmedRegistration() {
        CreateRaceEntryRequest request = request();
        Registration registration = registration();
        registration.setStatus("ACCEPTED");
        when(registrationRepository.findByIdForUpdate(20)).thenReturn(Optional.of(registration));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createRaceEntry(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void createRaceEntryRejectsNonDraftRace() {
        CreateRaceEntryRequest request = request();
        Registration registration = registration();
        Race race = race();
        race.setStatus(EventStatus.CANCELLED);
        when(registrationRepository.findByIdForUpdate(20)).thenReturn(Optional.of(registration));
        when(raceRepository.findByIdForUpdate(10)).thenReturn(Optional.of(race));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createRaceEntry(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("Chỉ cuộc đua đang ở trạng thái DRAFT mới có thể nhận suất tham gia.", exception.getMessage());
    }

    @Test
    void createRaceEntryRejectsRegistrationFromAnotherTournament() {
        CreateRaceEntryRequest request = request();
        Registration registration = registration();
        Race race = race();
        TournamentRound round = round();
        round.setTournamentId(99);
        when(registrationRepository.findByIdForUpdate(20)).thenReturn(Optional.of(registration));
        when(raceRepository.findByIdForUpdate(10)).thenReturn(Optional.of(race));
        when(tournamentRoundRepository.findById(5)).thenReturn(Optional.of(round));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createRaceEntry(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceEntryRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRaceEntryRejectsExistingEntryInSameRound() {
        CreateRaceEntryRequest request = request();
        mockValidAssignment(request);
        when(raceEntryRepository.existsActiveEntryByRoundAndRegistration(5, 20, "WITHDRAWN"))
                .thenReturn(true);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createRaceEntry(request));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(raceEntryRepository, never()).findMaxLaneNumber(any());
    }

    private void mockValidAssignment(CreateRaceEntryRequest request) {
        when(registrationRepository.findByIdForUpdate(request.getRegistrationId()))
                .thenReturn(Optional.of(registration()));
        when(raceRepository.findByIdForUpdate(request.getRaceId()))
                .thenReturn(Optional.of(race()));
        when(tournamentRoundRepository.findById(5)).thenReturn(Optional.of(round()));
        when(raceEntryRepository.existsByRaceIdAndRegistrationId(10, 20)).thenReturn(false);
        when(raceEntryRepository.existsActiveEntryByRoundAndRegistration(5, 20, "WITHDRAWN"))
                .thenReturn(false);
    }

    private CreateRaceEntryRequest request() {
        CreateRaceEntryRequest request = new CreateRaceEntryRequest();
        request.setRaceId(10);
        request.setRegistrationId(20);
        return request;
    }

    private Registration registration() {
        return Registration.builder()
                .registrationId(20)
                .tournamentId(1)
                .status("CONFIRMED")
                .build();
    }

    private Race race() {
        Race race = new Race();
        race.setRaceId(10);
        race.setRoundId(5);
        race.setStatus(EventStatus.DRAFT);
        return race;
    }

    private TournamentRound round() {
        TournamentRound round = new TournamentRound();
        round.setRoundId(5);
        round.setTournamentId(1);
        return round;
    }
}
