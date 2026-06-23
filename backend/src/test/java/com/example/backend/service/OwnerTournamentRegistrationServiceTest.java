package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.constant.PaymentStatus;
import com.example.backend.constant.RaceEntryStatus;
import com.example.backend.constant.RegistrationStatus;
import com.example.backend.dto.request.OwnerTournamentRegistrationRequest;
import com.example.backend.dto.response.RegistrationResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RaceEntryRepository;
import com.example.backend.repository.RaceRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnerTournamentRegistrationServiceTest {

    @Mock private RegistrationRepository registrationRepository;
    @Mock private TournamentRepository tournamentRepository;
    @Mock private HorseRepository horseRepository;
    @Mock private UserRepository userRepository;
    @Mock private JockeyProfileRepository jockeyProfileRepository;
    @Mock private JockeyInvitationRepository jockeyInvitationRepository;
    @Mock private RaceEntryRepository raceEntryRepository;
    @Mock private RaceRepository raceRepository;

    private OwnerTournamentRegistrationService service;

    @BeforeEach
    void setUp() {
        service = new OwnerTournamentRegistrationService(
                registrationRepository,
                tournamentRepository,
                horseRepository,
                userRepository,
                jockeyProfileRepository,
                jockeyInvitationRepository,
                raceEntryRepository,
                raceRepository
        );

        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(
                        "owner@example.com",
                        null
                ));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void submitSuccessCreatesPendingUnpaidRegistration() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(true);
        stubNoRegistrationConflicts(tournament, horse, owner, jockey);
        when(registrationRepository.save(any(Registration.class)))
                .thenAnswer(invocation -> {
                    Registration registration = invocation.getArgument(0);
                    registration.setRegistrationId(77);
                    return registration;
                });
        when(tournamentRepository.findById(10)).thenReturn(Optional.of(tournament));
        when(horseRepository.findById(20)).thenReturn(Optional.of(horse));
        when(userRepository.findById(30)).thenReturn(Optional.of(owner));
        when(userRepository.findById(40)).thenReturn(Optional.of(jockey));
        when(raceEntryRepository.findByRegistrationIdAndStatus(
                77, RaceEntryStatus.ASSIGNED
        )).thenReturn(Optional.empty());

        RegistrationResponse response = service.submitRegistration(request);

        ArgumentCaptor<Registration> captor =
                ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());
        Registration saved = captor.getValue();

        assertEquals(10, saved.getTournamentId());
        assertEquals(20, saved.getHorseId());
        assertEquals(30, saved.getOwnerId());
        assertEquals(40, saved.getJockeyId());
        assertEquals(PaymentStatus.UNPAID, saved.getPaymentStatus());
        assertEquals(RegistrationStatus.PENDING, saved.getApprovalStatus());
        assertNotNull(saved.getSubmittedAt());
        assertTrue(saved.getRegistrationNo().startsWith("REG-T10-"));
        assertEquals(RegistrationStatus.PENDING, response.getApprovalStatus());
        assertEquals(PaymentStatus.UNPAID, response.getPaymentStatus());
    }

    @Test
    void submitFailsWithoutAcceptedInvitation() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.submitRegistration(request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "An ACCEPTED jockey invitation is required before registration.",
                exception.getMessage()
        );
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void submitRejectsDuplicateTournamentHorseRegistration() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        User jockey = user(40, "jockey@example.com", "JOCKEY");
        Tournament tournament = openTournament();
        Horse horse = activeHorse();

        stubBaseLookups(owner, jockey, tournament, horse);
        when(jockeyInvitationRepository.existsByTournamentIdAndHorseIdAndOwnerIdAndJockeyIdAndStatus(
                10, 20, 30, 40, "ACCEPTED"
        )).thenReturn(true);
        when(registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                eq(10),
                eq(20),
                any(Collection.class),
                eq(null)
        )).thenReturn(1L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.submitRegistration(request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Horse already has an active registration in this tournament.",
                exception.getMessage()
        );
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void submitRejectsTournamentNotOpen() {
        OwnerTournamentRegistrationRequest request = request();
        User owner = user(30, "owner@example.com", "OWNER");
        Tournament tournament = openTournament();
        tournament.setStatus(EventStatus.REGISTRATION_CLOSED);

        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(tournamentRepository.findById(10))
                .thenReturn(Optional.of(tournament));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.submitRegistration(request)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Tournament is not open for registration.",
                exception.getMessage()
        );
        verify(horseRepository, never()).findByHorseIdAndOwnerId(any(), any());
        verify(registrationRepository, never()).save(any());
    }

    private OwnerTournamentRegistrationRequest request() {
        OwnerTournamentRegistrationRequest request =
                new OwnerTournamentRegistrationRequest();
        request.setTournamentId(10);
        request.setHorseId(20);
        request.setJockeyId(40);
        return request;
    }

    private void stubBaseLookups(
            User owner,
            User jockey,
            Tournament tournament,
            Horse horse
    ) {
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));
        when(tournamentRepository.findById(10))
                .thenReturn(Optional.of(tournament));
        when(horseRepository.findByHorseIdAndOwnerId(20, 30))
                .thenReturn(Optional.of(horse));
        when(userRepository.findById(40))
                .thenReturn(Optional.of(jockey));
        when(jockeyProfileRepository.findById(40))
                .thenReturn(Optional.of(JockeyProfile.builder()
                        .jockeyId(40)
                        .weight(BigDecimal.valueOf(55))
                        .build()));
    }

    private void stubNoRegistrationConflicts(
            Tournament tournament,
            Horse horse,
            User owner,
            User jockey
    ) {
        when(registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                eq(tournament.getTournamentId()),
                eq(horse.getHorseId()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                eq(tournament.getTournamentId()),
                eq(owner.getUserID()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                eq(tournament.getTournamentId()),
                eq(jockey.getUserID()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
                eq(jockey.getUserID()),
                eq(tournament.getStartDate()),
                eq(tournament.getEndDate()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
        when(registrationRepository.countByOverlappingTournamentAndHorseIdAndJockeyIdAndStatusInExcludingRegistration(
                eq(horse.getHorseId()),
                eq(jockey.getUserID()),
                eq(tournament.getStartDate()),
                eq(tournament.getEndDate()),
                any(Collection.class),
                eq(null)
        )).thenReturn(0L);
    }

    private Tournament openTournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(10);
        tournament.setTournamentName("Summer Cup");
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        tournament.setRegistrationOpenAt(LocalDateTime.now().minusDays(1));
        tournament.setRegistrationCloseAt(LocalDateTime.now().plusDays(1));
        tournament.setStartDate(LocalDate.now().plusDays(3));
        tournament.setEndDate(LocalDate.now().plusDays(5));
        tournament.setMaxRegistrations(20);
        return tournament;
    }

    private Horse activeHorse() {
        return Horse.builder()
                .horseId(20)
                .ownerId(30)
                .horseName("Lightning")
                .breed("Thoroughbred")
                .gender("MALE")
                .weight(BigDecimal.valueOf(480))
                .healthCertExpiry(LocalDate.now().plusMonths(6))
                .status("ACTIVE")
                .build();
    }

    private User user(Integer id, String email, String roleName) {
        Role role = new Role();
        role.setRoleName(roleName);

        User user = new User();
        user.setUserID(id);
        user.setEmail(email);
        user.setUsername(roleName + " User");
        user.setStatus("ACTIVE");
        user.setRole(role);
        return user;
    }
}
