package com.example.backend.service;

import com.example.backend.constant.EventStatus;
import com.example.backend.entity.Horse;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.Registration;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentCondition;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.TournamentRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminRegistrationServiceTest {

    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private HorseRepository horseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TournamentRepository tournamentRepository;
    @Mock
    private TournamentConditionRepository tournamentConditionRepository;
    @Mock
    private JockeyProfileRepository jockeyProfileRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;

    private AdminRegistrationService service;

    @BeforeEach
    void setUp() {
        service = new AdminRegistrationService(
                registrationRepository,
                horseRepository,
                userRepository,
                tournamentRepository,
                tournamentConditionRepository,
                jockeyProfileRepository,
                jdbcTemplate);
    }

    @Test
    void confirmRegistrationChangesAcceptedRegistrationToConfirmed() {
        Registration registration = validRegistration();
        mockValidConfirmationData(registration);
        when(registrationRepository.save(registration)).thenReturn(registration);
        when(jdbcTemplate.queryForObject(any(String.class), eq(String.class), eq(1)))
                .thenReturn("Registration Test");

        var response = service.confirmRegistration(1);

        assertEquals("CONFIRMED", response.getStatus());
        verify(registrationRepository).save(registration);
    }

    @Test
    void confirmRegistrationRejectsNonAcceptedStatus() {
        Registration registration = validRegistration();
        registration.setStatus("CONFIRMED");
        when(registrationRepository.findByIdForUpdate(1)).thenReturn(Optional.of(registration));

        ApiException exception = assertThrows(ApiException.class,
                () -> service.confirmRegistration(1));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void confirmRegistrationRejectsInvalidTournamentStatus() {
        Registration registration = validRegistration();
        Tournament tournament = validTournament();
        tournament.setStatus(EventStatus.READY);
        mockEntityLookups(registration, tournament, validHorse(), validOwner(), validJockey(),
                validJockeyProfile(), validCondition());

        assertConflict(() -> service.confirmRegistration(1),
                "Tournament must be open or closed for registration.");
    }

    @Test
    void confirmRegistrationRejectsInactiveHorse() {
        Registration registration = validRegistration();
        Horse horse = validHorse();
        horse.setStatus("INACTIVE");
        mockEntityLookups(registration, validTournament(), horse, validOwner(), validJockey(),
                validJockeyProfile(), validCondition());

        assertConflict(() -> service.confirmRegistration(1), "Horse is not active.");
    }

    @Test
    void confirmRegistrationRejectsExpiredHorseCertificate() {
        Registration registration = validRegistration();
        Horse horse = validHorse();
        horse.setHealthCertExpiry(LocalDate.now().plusDays(5));
        mockEntityLookups(registration, validTournament(), horse, validOwner(), validJockey(),
                validJockeyProfile(), validCondition());

        assertConflict(() -> service.confirmRegistration(1),
                "Horse health certificate expires before the tournament starts.");
    }

    @Test
    void confirmRegistrationRejectsOverweightHorse() {
        Registration registration = validRegistration();
        Horse horse = validHorse();
        horse.setWeight(new BigDecimal("451.00"));
        mockEntityLookups(registration, validTournament(), horse, validOwner(), validJockey(),
                validJockeyProfile(), validCondition());

        assertConflict(() -> service.confirmRegistration(1),
                "Horse exceeds the tournament weight limit.");
    }

    @Test
    void confirmRegistrationRejectsInactiveJockeyProfile() {
        Registration registration = validRegistration();
        JockeyProfile profile = validJockeyProfile();
        profile.setStatus("INACTIVE");
        mockEntityLookups(registration, validTournament(), validHorse(), validOwner(), validJockey(),
                profile, validCondition());

        assertConflict(() -> service.confirmRegistration(1),
                "Jockey profile is not active.");
    }

    @Test
    void confirmRegistrationRejectsOverweightJockey() {
        Registration registration = validRegistration();
        JockeyProfile profile = validJockeyProfile();
        profile.setWeight(new BigDecimal("56.00"));
        mockEntityLookups(registration, validTournament(), validHorse(), validOwner(), validJockey(),
                profile, validCondition());

        assertConflict(() -> service.confirmRegistration(1),
                "Jockey exceeds the tournament weight limit.");
    }

    @Test
    void confirmRegistrationRejectsFullTournament() {
        Registration registration = validRegistration();
        mockEntityLookups(registration, validTournament(), validHorse(), validOwner(), validJockey(),
                validJockeyProfile(), validCondition());
        when(registrationRepository.countByTournamentIdAndStatusIn(1, List.of("CONFIRMED")))
                .thenReturn(12L);

        assertConflict(() -> service.confirmRegistration(1),
                "Tournament has reached maximum participants.");
    }

    @Test
    void confirmRegistrationRejectsDuplicateConfirmedJockey() {
        Registration registration = validRegistration();
        mockEntityLookups(registration, validTournament(), validHorse(), validOwner(), validJockey(),
                validJockeyProfile(), validCondition());
        when(registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                1, 1, List.of("CONFIRMED"), 1)).thenReturn(0L);
        when(registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                1, 3, List.of("CONFIRMED"), 1)).thenReturn(1L);

        assertConflict(() -> service.confirmRegistration(1),
                "Jockey already has a confirmed registration for this tournament.");
        verify(registrationRepository, never()).countByTournamentIdAndStatusIn(any(), any());
    }

    @Test
    void rejectRegistrationDoesNotRunConfirmationValidations() {
        Registration registration = validRegistration();
        when(registrationRepository.findByIdForUpdate(1)).thenReturn(Optional.of(registration));
        when(registrationRepository.save(registration)).thenReturn(registration);
        when(horseRepository.findById(1)).thenReturn(Optional.of(validHorse()));
        when(userRepository.findById(2)).thenReturn(Optional.of(validOwner()));
        when(userRepository.findById(3)).thenReturn(Optional.of(validJockey()));
        when(jdbcTemplate.queryForObject(any(String.class), eq(String.class), eq(1)))
                .thenReturn("Registration Test");

        var response = service.rejectRegistration(1);

        assertEquals("REJECTED", response.getStatus());
        verify(tournamentRepository, never()).findById(any());
    }

    private void mockValidConfirmationData(Registration registration) {
        mockEntityLookups(registration, validTournament(), validHorse(), validOwner(), validJockey(),
                validJockeyProfile(), validCondition());
        when(registrationRepository.countByTournamentIdAndStatusIn(1, List.of("CONFIRMED")))
                .thenReturn(0L);
        when(registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                1, 1, List.of("CONFIRMED"), 1)).thenReturn(0L);
        when(registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                1, 3, List.of("CONFIRMED"), 1)).thenReturn(0L);
    }

    private void mockEntityLookups(
            Registration registration,
            Tournament tournament,
            Horse horse,
            User owner,
            User jockey,
            JockeyProfile jockeyProfile,
            TournamentCondition condition) {
        when(registrationRepository.findByIdForUpdate(1)).thenReturn(Optional.of(registration));
        when(tournamentRepository.findByIdForUpdate(1)).thenReturn(Optional.of(tournament));
        lenient().when(tournamentConditionRepository.findById(1)).thenReturn(Optional.of(condition));
        lenient().when(userRepository.findById(2)).thenReturn(Optional.of(owner));
        lenient().when(horseRepository.findById(1)).thenReturn(Optional.of(horse));
        lenient().when(userRepository.findById(3)).thenReturn(Optional.of(jockey));
        lenient().when(jockeyProfileRepository.findById(3)).thenReturn(Optional.of(jockeyProfile));
    }

    private void assertConflict(Runnable action, String message) {
        ApiException exception = assertThrows(ApiException.class, action::run);
        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(message, exception.getMessage());
        verify(registrationRepository, never()).save(any());
    }

    private Registration validRegistration() {
        return Registration.builder()
                .registrationId(1)
                .tournamentId(1)
                .horseId(1)
                .ownerId(2)
                .jockeyId(3)
                .status("ACCEPTED")
                .build();
    }

    private Tournament validTournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(1);
        tournament.setTournamentName("Registration Test");
        tournament.setStatus(EventStatus.OPEN_FOR_REGISTRATION);
        tournament.setStartDate(LocalDate.now().plusDays(10));
        tournament.setMaxParticipants(12);
        tournament.setConditionId(1);
        return tournament;
    }

    private TournamentCondition validCondition() {
        TournamentCondition condition = new TournamentCondition();
        condition.setConditionId(1);
        condition.setMaxHorseWeight(new BigDecimal("450.00"));
        condition.setMaxJockeyWeight(new BigDecimal("55.00"));
        return condition;
    }

    private Horse validHorse() {
        return Horse.builder()
                .horseId(1)
                .ownerId(2)
                .horseName("Thunder Test")
                .weight(new BigDecimal("430.00"))
                .healthCertExpiry(LocalDate.now().plusDays(30))
                .status("ACTIVE")
                .build();
    }

    private User validOwner() {
        User owner = new User();
        owner.setUserID(2);
        owner.setFullName("Test Owner");
        owner.setStatus("ACTIVE");
        return owner;
    }

    private User validJockey() {
        User jockey = new User();
        jockey.setUserID(3);
        jockey.setFullName("Test Jockey");
        jockey.setStatus("ACTIVE");
        return jockey;
    }

    private JockeyProfile validJockeyProfile() {
        return JockeyProfile.builder()
                .jockeyId(3)
                .weight(new BigDecimal("52.00"))
                .status("ACTIVE")
                .build();
    }
}
