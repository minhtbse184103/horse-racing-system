package com.example.backend.service;

import com.example.backend.dto.response.JockeyInvitationResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyInvitation;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.HorsePerformanceSummaryRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyPerformanceSummaryRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.JockeyVerificationFileRepository;
import com.example.backend.repository.JockeyVerificationRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceResultRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JockeyServiceInvitationEligibilityTest {

    @Mock private JockeyProfileRepository jockeyProfileRepository;
    @Mock private JockeyInvitationRepository jockeyInvitationRepository;
    @Mock private JockeyVerificationRepository jockeyVerificationRepository;
    @Mock private JockeyVerificationFileRepository jockeyVerificationFileRepository;
    @Mock private RegistrationRepository registrationRepository;
    @Mock private RaceEntryRepository raceEntryRepository;
    @Mock private RaceResultRepository raceResultRepository;
    @Mock private HorseRepository horseRepository;
    @Mock private HorsePerformanceSummaryRepository horsePerformanceSummaryRepository;
    @Mock private UserRepository userRepository;
    @Mock private JockeyPerformanceSummaryRepository jockeyPerformanceSummaryRepository;
    @Mock private TournamentRepository tournamentRepository;
    @Mock private TournamentService tournamentService;
    @Mock private RegistrationAvailabilityService availabilityService;
    @Mock private RegistrationEligibilityService eligibilityService;
    @Mock private JockeyInvitationService jockeyInvitationService;

    private JockeyServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new JockeyServiceImpl(
                jockeyProfileRepository,
                jockeyInvitationRepository,
                jockeyVerificationRepository,
                jockeyVerificationFileRepository,
                registrationRepository,
                raceEntryRepository,
                raceResultRepository,
                horseRepository,
                horsePerformanceSummaryRepository,
                userRepository,
                jockeyPerformanceSummaryRepository,
                tournamentRepository,
                tournamentService,
                availabilityService,
                eligibilityService,
                jockeyInvitationService
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "jockey@example.com",
                        null
                )
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void acceptInvitationDoesNotCreateRegistrationWhenEligibilityFails() {
        Scenario scenario = stubAcceptScenario();
        doThrow(new ApiException(
                HttpStatus.CONFLICT,
                "Horse does not satisfy the tournament weight condition."
        )).when(eligibilityService).validateNewSubmission(
                scenario.tournament(), 20, 30, 40
        );

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.acceptInvitation(5)
        );

        assertEquals(
                "Horse does not satisfy the tournament weight condition.",
                exception.getMessage()
        );
        verify(eligibilityService).validateNewSubmission(
                scenario.tournament(), 20, 30, 40
        );
        verify(availabilityService, never())
                .validateAcceptedInvitationCanCreateRegistration(
                        any(), any(), any(), any(), any()
                );
        verify(registrationRepository, never()).save(any());
        verify(jockeyInvitationRepository, never()).save(any());
    }

    @Test
    void acceptInvitationValidatesBeforeRegistrationAndInvitationAreSaved() {
        Scenario scenario = stubAcceptScenario();
        when(registrationRepository.save(any(Registration.class)))
                .thenAnswer(invocation -> {
                    Registration registration = invocation.getArgument(0);
                    registration.setRegistrationId(77);
                    return registration;
                });
        when(jockeyInvitationRepository.save(scenario.invitation()))
                .thenReturn(scenario.invitation());
        when(jockeyInvitationService.toResponse(scenario.invitation()))
                .thenReturn(JockeyInvitationResponse.builder()
                        .invitationId(5)
                        .registrationId(77)
                        .status("ACCEPTED")
                        .build());

        JockeyInvitationResponse response = service.acceptInvitation(5);

        assertEquals(77, response.getRegistrationId());
        InOrder order = inOrder(
                eligibilityService,
                availabilityService,
                registrationRepository,
                jockeyInvitationRepository
        );
        order.verify(eligibilityService).validateNewSubmission(
                scenario.tournament(), 20, 30, 40
        );
        order.verify(availabilityService)
                .validateAcceptedInvitationCanCreateRegistration(
                        30, 20, 40, scenario.tournament(), 5
                );
        order.verify(registrationRepository).save(any(Registration.class));
        order.verify(jockeyInvitationRepository).save(scenario.invitation());
    }

    private Scenario stubAcceptScenario() {
        User jockey = activeJockey();
        JockeyInvitation invitation = JockeyInvitation.builder()
                .invitationId(5)
                .tournamentId(10)
                .horseId(20)
                .ownerId(30)
                .jockeyId(40)
                .status("PENDING")
                .expiredAt(LocalDateTime.now().plusHours(2))
                .build();
        Horse horse = Horse.builder()
                .horseId(20)
                .ownerId(30)
                .horseName("Lightning")
                .status("ACTIVE")
                .build();
        Tournament tournament = new Tournament();
        tournament.setTournamentId(10);
        tournament.setTournamentName("Eligibility Cup");
        tournament.setRegistrationOpenAt(LocalDateTime.now().minusDays(1));
        tournament.setRegistrationCloseAt(LocalDateTime.now().plusDays(1));
        tournament.setStartDate(LocalDate.now().plusDays(3));
        tournament.setEndDate(LocalDate.now().plusDays(5));
        tournament.setStatus("OPEN_FOR_REGISTRATION");

        when(userRepository.findByEmail("jockey@example.com"))
                .thenReturn(Optional.of(jockey));
        when(jockeyProfileRepository.existsById(40)).thenReturn(true);
        when(jockeyInvitationRepository.findByInvitationIdAndJockeyId(5, 40))
                .thenReturn(Optional.of(invitation));
        when(horseRepository.findById(20)).thenReturn(Optional.of(horse));
        when(tournamentRepository.findById(10))
                .thenReturn(Optional.of(tournament));

        return new Scenario(invitation, tournament);
    }

    private User activeJockey() {
        Role role = new Role();
        role.setRoleName("JOCKEY");

        User jockey = new User();
        jockey.setUserID(40);
        jockey.setEmail("jockey@example.com");
        jockey.setUsername("jockey");
        jockey.setStatus("ACTIVE");
        jockey.setRole(role);
        return jockey;
    }

    private record Scenario(
            JockeyInvitation invitation,
            Tournament tournament
    ) {
    }
}
