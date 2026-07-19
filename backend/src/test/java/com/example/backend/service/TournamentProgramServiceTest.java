package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.dto.request.CreateTournamentProgramRaceRequest;
import com.example.backend.dto.request.CreateTournamentProgramRequest;
import com.example.backend.dto.request.CreateTournamentRequest;
import com.example.backend.dto.request.RacePrizeRequest;
import com.example.backend.dto.request.TournamentConditionRequest;
import com.example.backend.dto.response.TournamentDetailResponse;
import com.example.backend.entity.Race;
import com.example.backend.entity.RacePrize;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentCondition;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.RacePrizeRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TournamentProgramServiceTest {

    @Mock private TournamentRepository tournamentRepository;
    @Mock private TournamentConditionRepository conditionRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private RacePrizeRepository racePrizeRepository;
    @Mock private UserRepository userRepository;
    @Mock private TournamentService tournamentService;

    private TournamentProgramService service;

    @BeforeEach
    void setUp() {
        service = new TournamentProgramService(
                tournamentRepository,
                conditionRepository,
                raceRepository,
                racePrizeRepository,
                userRepository,
                tournamentService
        );
    }

    @Test
    void createTournamentProgramCreatesTournamentConditionsRacesAndPrizes() {
        CreateTournamentProgramRequest request = validProgramRequest();
        TournamentDetailResponse detailResponse = TournamentDetailResponse
                .builder()
                .tournamentId(1)
                .status(EventStatus.OPEN_FOR_REGISTRATION)
                .raceCount(2)
                .build();

        stubAdmin();
        when(tournamentRepository.save(any(Tournament.class)))
                .thenAnswer(invocation -> {
                    Tournament tournament = invocation.getArgument(0);
                    tournament.setTournamentId(1);
                    return tournament;
                });
        AtomicInteger raceId = new AtomicInteger(10);
        when(raceRepository.save(any(Race.class)))
                .thenAnswer(invocation -> {
                    Race race = invocation.getArgument(0);
                    race.setRaceId(raceId.getAndIncrement());
                    return race;
                });
        when(tournamentService.getTournamentById(1))
                .thenReturn(detailResponse);

        TournamentDetailResponse response = service.createTournamentProgram(
                request,
                "admin@example.com"
        );

        ArgumentCaptor<Tournament> tournamentCaptor =
                ArgumentCaptor.forClass(Tournament.class);
        ArgumentCaptor<List<TournamentCondition>> conditionCaptor =
                ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<Race> raceCaptor = ArgumentCaptor.forClass(Race.class);
        ArgumentCaptor<List<RacePrize>> prizeCaptor =
                ArgumentCaptor.forClass(List.class);

        verify(tournamentRepository).save(tournamentCaptor.capture());
        verify(conditionRepository).saveAll(conditionCaptor.capture());
        verify(raceRepository, org.mockito.Mockito.times(2))
                .save(raceCaptor.capture());
        verify(racePrizeRepository, org.mockito.Mockito.times(2))
                .saveAll(prizeCaptor.capture());

        assertEquals(EventStatus.OPEN_FOR_REGISTRATION,
                tournamentCaptor.getValue().getStatus());
        assertEquals(99, tournamentCaptor.getValue().getCreatedBy());
        assertEquals(1, conditionCaptor.getValue().size());
        assertEquals("Race A", raceCaptor.getAllValues().getFirst().getRaceName());
        assertEquals(1, response.getTournamentId());
        assertEquals(2, response.getRaceCount());
    }

    @Test
    void createTournamentProgramRejectsDuplicateRaceName() {
        CreateTournamentProgramRequest request = validProgramRequest();
        request.getRaces().get(1).setRaceName(" race a ");

        stubAdmin();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createTournamentProgram(request, "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Race name already exists in this tournament.",
                exception.getMessage()
        );
        verifyNoProgramSave();
    }

    @Test
    void createTournamentProgramRejectsDuplicateRaceOrder() {
        CreateTournamentProgramRequest request = validProgramRequest();
        request.getRaces().get(1).setRaceOrder(1);

        stubAdmin();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createTournamentProgram(request, "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Race order already exists in this tournament.",
                exception.getMessage()
        );
        verifyNoProgramSave();
    }

    @Test
    void createTournamentProgramRejectsSameTrackOverlap() {
        CreateTournamentProgramRequest request = validProgramRequest();
        request.getRaces().get(1).setTrackName("track a");
        request.getRaces().get(1).setRaceStartTime(
                request.getRaces().get(0).getRaceStartTime().plusMinutes(30)
        );
        request.getRaces().get(1).setRaceEndTime(
                request.getRaces().get(0).getRaceEndTime().plusMinutes(30)
        );

        stubAdmin();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createTournamentProgram(request, "admin@example.com")
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Race schedule overlaps with another race on the same track.",
                exception.getMessage()
        );
        verifyNoProgramSave();
    }

    @Test
    void createTournamentProgramAllowsDifferentTrackOverlap() {
        CreateTournamentProgramRequest request = validProgramRequest();
        request.getRaces().get(1).setRaceStartTime(
                request.getRaces().get(0).getRaceStartTime().plusMinutes(30)
        );
        request.getRaces().get(1).setRaceEndTime(
                request.getRaces().get(0).getRaceEndTime().plusMinutes(30)
        );
        TournamentDetailResponse detailResponse = TournamentDetailResponse
                .builder()
                .tournamentId(1)
                .raceCount(2)
                .build();

        stubAdmin();
        when(tournamentRepository.save(any(Tournament.class)))
                .thenAnswer(invocation -> {
                    Tournament tournament = invocation.getArgument(0);
                    tournament.setTournamentId(1);
                    return tournament;
                });
        AtomicInteger raceId = new AtomicInteger(10);
        when(raceRepository.save(any(Race.class)))
                .thenAnswer(invocation -> {
                    Race race = invocation.getArgument(0);
                    race.setRaceId(raceId.getAndIncrement());
                    return race;
                });
        when(tournamentService.getTournamentById(1))
                .thenReturn(detailResponse);

        TournamentDetailResponse response = service.createTournamentProgram(
                request,
                "admin@example.com"
        );

        assertEquals(2, response.getRaceCount());
        verify(raceRepository, org.mockito.Mockito.times(2)).save(any(Race.class));
    }

    @Test
    void createTournamentProgramRejectsEmptyPrizeList() {
        CreateTournamentProgramRequest request = validProgramRequest();
        request.getRaces().getFirst().setPrizes(List.of());

        stubAdmin();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createTournamentProgram(request, "admin@example.com")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("Race must contain at least one prize.", exception.getMessage());
        verifyNoProgramSave();
    }

    @Test
    void createTournamentProgramRejectsInvalidPrizeSplit() {
        CreateTournamentProgramRequest request = validProgramRequest();
        request.getRaces().getFirst().getPrizes().getFirst()
                .setOwnerPercent(new BigDecimal("70"));
        request.getRaces().getFirst().getPrizes().getFirst()
                .setJockeyPercent(new BigDecimal("20"));

        stubAdmin();

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createTournamentProgram(request, "admin@example.com")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(
                "Owner and jockey prize percentages must total 100.",
                exception.getMessage()
        );
        verifyNoProgramSave();
    }

    @Test
    void createTournamentProgramRejectsNonAdmin() {
        CreateTournamentProgramRequest request = validProgramRequest();
        User nonAdmin = new User();
        Role ownerRole = new Role();
        ownerRole.setRoleName("OWNER");
        nonAdmin.setRole(ownerRole);
        nonAdmin.setStatus("ACTIVE");
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(nonAdmin));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.createTournamentProgram(request, "owner@example.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        verifyNoProgramSave();
    }

    private void stubAdmin() {
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(activeAdmin()));
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

    private void verifyNoProgramSave() {
        verify(tournamentRepository, never()).save(any());
        verify(conditionRepository, never()).saveAll(any());
        verify(raceRepository, never()).save(any());
        verify(racePrizeRepository, never()).saveAll(any());
    }

    private CreateTournamentProgramRequest validProgramRequest() {
        CreateTournamentProgramRequest request = new CreateTournamentProgramRequest();
        request.setTournament(validTournamentRequest());
        request.setRaces(List.of(
                raceRequest("Race A", "Track A", 1, 9),
                raceRequest("Race B", "Track B", 2, 10)
        ));
        return request;
    }

    private CreateTournamentRequest validTournamentRequest() {
        LocalDate start = LocalDate.now().plusDays(5);
        CreateTournamentRequest request = new CreateTournamentRequest();
        request.setTournamentName(" Summer Championship ");
        request.setDescription("Season opener");
        request.setVenue("Bangkok Track");
        request.setRegistrationOpenAt(LocalDateTime.now().plusDays(1));
        request.setRegistrationCloseAt(start.atStartOfDay().minusDays(1));
        request.setStartDate(start);
        request.setEndDate(start.plusDays(2));
        request.setMaxRegistrations(24);
        request.setEntryFee(new BigDecimal("1500000"));
        request.setConditions(List.of(genderCondition()));
        return request;
    }

    private TournamentConditionRequest genderCondition() {
        TournamentConditionRequest condition = new TournamentConditionRequest();
        condition.setConditionType("GENDER");
        condition.setOperator("EQ");
        condition.setValue("MALE");
        return condition;
    }

    private CreateTournamentProgramRaceRequest raceRequest(
            String raceName,
            String trackName,
            Integer raceOrder,
            int startHour
    ) {
        LocalDate raceDate = LocalDate.now().plusDays(5);
        CreateTournamentProgramRaceRequest request =
                new CreateTournamentProgramRaceRequest();
        request.setRaceName(raceName);
        request.setTrackName(trackName);
        request.setRaceStartTime(raceDate.atTime(startHour, 0));
        request.setRaceEndTime(raceDate.atTime(startHour + 1, 0));
        request.setDistance(1600);
        request.setMaxRunners(6);
        request.setRaceOrder(raceOrder);
        request.setPrizes(List.of(prizeRequest()));
        return request;
    }

    private RacePrizeRequest prizeRequest() {
        RacePrizeRequest request = new RacePrizeRequest();
        request.setRankPosition(1);
        request.setAmount(new BigDecimal("50000"));
        request.setOwnerPercent(new BigDecimal("80"));
        request.setJockeyPercent(new BigDecimal("20"));
        return request;
    }
}
