package com.example.backend.service;

import com.example.backend.constant.ConditionOperator;
import com.example.backend.constant.ConditionType;
import com.example.backend.constant.EventStatus;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Role;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentCondition;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationEligibilityServiceTest {

    @Mock private RegistrationRepository registrationRepository;
    @Mock private TournamentConditionRepository conditionRepository;
    @Mock private HorseRepository horseRepository;
    @Mock private UserRepository userRepository;
    @Mock private JockeyProfileRepository jockeyProfileRepository;

    private RegistrationEligibilityService service;

    @BeforeEach
    void setUp() {
        service = new RegistrationEligibilityService(
                registrationRepository,
                conditionRepository,
                horseRepository,
                userRepository,
                jockeyProfileRepository
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"MALE", "FEMALE"})
    void genderAnyAcceptsEveryHorseGender(String horseGender) {
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        horse.setSex(horseGender);
        stubOwnerAndHorse(horse);
        when(conditionRepository.findByTournamentIdOrderByConditionIdAsc(10))
                .thenReturn(List.of(genderCondition(" any ")));

        assertDoesNotThrow(() -> service.validateParticipationRequirements(
                tournament, 20, 30, null
        ));
    }

    @Test
    void genderSpecificComparisonIgnoresCaseAndWhitespace() {
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        horse.setSex(" male ");
        stubOwnerAndHorse(horse);
        when(conditionRepository.findByTournamentIdOrderByConditionIdAsc(10))
                .thenReturn(List.of(genderCondition("MALE")));

        assertDoesNotThrow(() -> service.validateParticipationRequirements(
                tournament, 20, 30, null
        ));
    }

    @Test
    void genderSpecificRejectsDifferentGender() {
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        horse.setSex("FEMALE");
        stubOwnerAndHorse(horse);
        when(conditionRepository.findByTournamentIdOrderByConditionIdAsc(10))
                .thenReturn(List.of(genderCondition("MALE")));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateParticipationRequirements(
                        tournament, 20, 30, null
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Horse does not satisfy the tournament gender condition.",
                exception.getMessage()
        );
    }

    @Test
    void healthCertificateExpiringBeforeTournamentStartIsRejected() {
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        horse.setHealthCertExpiry(tournament.getStartDate().minusDays(1));
        stubOwnerAndHorse(horse);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateParticipationRequirements(
                        tournament, 20, 30, null
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Horse health certificate expires before the tournament starts.",
                exception.getMessage()
        );
    }

    @Test
    void healthCertificateExpiringOnTournamentStartIsAccepted() {
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        horse.setHealthCertExpiry(tournament.getStartDate());
        stubOwnerAndHorse(horse);
        when(conditionRepository.findByTournamentIdOrderByConditionIdAsc(10))
                .thenReturn(List.of());

        assertDoesNotThrow(() -> service.validateParticipationRequirements(
                tournament, 20, 30, null
        ));
    }

    @ParameterizedTest
    @MethodSource("numericOperatorCases")
    void weightOperatorsRespectStrictAndInclusiveBoundaries(
            String operator,
            String configuredValue,
            String actualWeight,
            boolean expectedValid
    ) {
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        horse.setWeight(new BigDecimal(actualWeight));
        stubOwnerAndHorse(horse);
        when(conditionRepository.findByTournamentIdOrderByConditionIdAsc(10))
                .thenReturn(List.of(numericCondition(
                        ConditionType.WEIGHT,
                        operator,
                        configuredValue,
                        null,
                        null
                )));

        if (expectedValid) {
            assertDoesNotThrow(() -> service.validateParticipationRequirements(
                    tournament, 20, 30, null
            ));
            return;
        }

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateParticipationRequirements(
                        tournament, 20, 30, null
                )
        );
        assertEquals(
                "Horse does not satisfy the tournament weight condition.",
                exception.getMessage()
        );
    }

    @ParameterizedTest
    @MethodSource("ageBetweenCases")
    void ageBetweenIncludesBothEndpoints(int age, boolean expectedValid) {
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        horse.setAge(age);
        stubOwnerAndHorse(horse);
        when(conditionRepository.findByTournamentIdOrderByConditionIdAsc(10))
                .thenReturn(List.of(numericCondition(
                        ConditionType.AGE,
                        ConditionOperator.BETWEEN,
                        null,
                        new BigDecimal("3"),
                        new BigDecimal("10")
                )));

        if (expectedValid) {
            assertDoesNotThrow(() -> service.validateParticipationRequirements(
                    tournament, 20, 30, null
            ));
        } else {
            ApiException exception = assertThrows(
                    ApiException.class,
                    () -> service.validateParticipationRequirements(
                            tournament, 20, 30, null
                    )
            );
            assertEquals(
                    "Horse does not satisfy the tournament age condition.",
                    exception.getMessage()
            );
        }
    }

    @Test
    void malformedNumericConditionIsRejectedAsConfigurationError() {
        Tournament tournament = openTournament();
        Horse horse = activeHorse();
        stubOwnerAndHorse(horse);
        when(conditionRepository.findByTournamentIdOrderByConditionIdAsc(10))
                .thenReturn(List.of(numericCondition(
                        ConditionType.WEIGHT,
                        ConditionOperator.LTE,
                        "not-a-number",
                        null,
                        null
                )));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.validateParticipationRequirements(
                        tournament, 20, 30, null
                )
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals(
                "Tournament condition contains an invalid numeric value.",
                exception.getMessage()
        );
    }

    private static Stream<Arguments> numericOperatorCases() {
        return Stream.of(
                Arguments.of(ConditionOperator.EQ, "480", "480.00", true),
                Arguments.of(ConditionOperator.EQ, "480", "480.01", false),
                Arguments.of(ConditionOperator.GT, "480", "480.01", true),
                Arguments.of(ConditionOperator.GT, "480", "480.00", false),
                Arguments.of(ConditionOperator.GTE, "480", "480.00", true),
                Arguments.of(ConditionOperator.GTE, "480", "479.99", false),
                Arguments.of(ConditionOperator.LT, "480", "479.99", true),
                Arguments.of(ConditionOperator.LT, "480", "480.00", false),
                Arguments.of(ConditionOperator.LTE, "480", "480.00", true),
                Arguments.of(ConditionOperator.LTE, "480", "480.01", false)
        );
    }

    private static Stream<Arguments> ageBetweenCases() {
        return Stream.of(
                Arguments.of(2, false),
                Arguments.of(3, true),
                Arguments.of(10, true),
                Arguments.of(11, false)
        );
    }

    private void stubOwnerAndHorse(Horse horse) {
        when(userRepository.findById(30)).thenReturn(Optional.of(activeOwner()));
        when(horseRepository.findById(20)).thenReturn(Optional.of(horse));
    }

    private Tournament openTournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(10);
        tournament.setTournamentName("Eligibility Cup");
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
                .age(4)
                .dayOfBirth(LocalDate.now().minusYears(4))
                .weight(new BigDecimal("480"))
                .sex("MALE")
                .healthCertExpiry(LocalDate.now().plusMonths(6))
                .status("ACTIVE")
                .build();
    }

    private User activeOwner() {
        Role ownerRole = new Role();
        ownerRole.setRoleName("OWNER");

        User owner = new User();
        owner.setUserID(30);
        owner.setEmail("owner@example.com");
        owner.setUsername("owner");
        owner.setStatus("ACTIVE");
        owner.setRole(ownerRole);
        return owner;
    }

    private TournamentCondition genderCondition(String value) {
        TournamentCondition condition = new TournamentCondition();
        condition.setTournamentId(10);
        condition.setConditionType(ConditionType.GENDER);
        condition.setOperator(ConditionOperator.EQ);
        condition.setValue(value);
        return condition;
    }

    private TournamentCondition numericCondition(
            String type,
            String operator,
            String value,
            BigDecimal minValue,
            BigDecimal maxValue
    ) {
        TournamentCondition condition = new TournamentCondition();
        condition.setTournamentId(10);
        condition.setConditionType(type);
        condition.setOperator(operator);
        condition.setValue(value);
        condition.setMinValue(minValue);
        condition.setMaxValue(maxValue);
        return condition;
    }
}
