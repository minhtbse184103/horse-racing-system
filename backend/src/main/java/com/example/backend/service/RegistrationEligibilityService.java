package com.example.backend.service;

import com.example.backend.constant.*;
import com.example.backend.entity.*;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class RegistrationEligibilityService {

    private static final String ACTIVE = "ACTIVE";

    private final RegistrationRepository registrationRepository;
    private final TournamentConditionRepository conditionRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final JockeyProfileRepository jockeyProfileRepository;

    public RegistrationEligibilityService(
            RegistrationRepository registrationRepository,
            TournamentConditionRepository conditionRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            JockeyProfileRepository jockeyProfileRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.conditionRepository = conditionRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
    }

    public void validateNewSubmission(
            Tournament tournament,
            Integer horseId,
            Integer ownerId,
            Integer jockeyId
    ) {
        validateSubmissionWindow(tournament);

        User owner = getUser(ownerId, "Owner");
        Horse horse = getHorse(horseId);

        validateOwner(owner);
        validateHorseOwnership(horse, ownerId);
        validateHorse(horse, tournament);
        validateConditions(horse, tournament);

        if (jockeyId != null) {
            validateJockey(jockeyId);
        }

        boolean duplicateActiveRegistration =
                registrationRepository.existsActiveRegistration(
                        tournament.getTournamentId(),
                        horseId,
                        List.of(
                                RegistrationStatus.PENDING,
                                RegistrationStatus.APPROVED
                        ),
                        null
                );

        if (duplicateActiveRegistration) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse already has an active registration in this tournament."
            );
        }

        long activeRegistrationCount =
                registrationRepository
                        .countByTournamentIdAndApprovalStatusIn(
                                tournament.getTournamentId(),
                                List.of(
                                        RegistrationStatus.PENDING,
                                        RegistrationStatus.APPROVED
                                )
                        );

        if (activeRegistrationCount >= tournament.getMaxRegistrations()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament has reached its registration capacity."
            );
        }
    }

    public void validateForApproval(
            Registration registration,
            Tournament tournament
    ) {
        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(tournament.getStatus())
                && !EventStatus.REGISTRATION_CLOSED.equals(
                tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament is not available for registration review."
            );
        }
        if (!PaymentStatus.PAID.equals(
                registration.getPaymentStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration must be paid before it can be approved."
            );
        }

        validateOriginalSubmissionTime(registration, tournament);

        User owner = getUser(registration.getOwnerId(), "Owner");
        Horse horse = getHorse(registration.getHorseId());

        validateOwner(owner);
        validateHorseOwnership(horse, registration.getOwnerId());
        validateHorse(horse, tournament);
        validateConditions(horse, tournament);

        if (registration.getJockeyId() != null) {
            validateJockey(registration.getJockeyId());
        }

        boolean duplicateApprovedRegistration =
                registrationRepository.existsActiveRegistration(
                        tournament.getTournamentId(),
                        registration.getHorseId(),
                        List.of(RegistrationStatus.APPROVED),
                        registration.getRegistrationId()
                );

        if (duplicateApprovedRegistration) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse already has an approved registration in this tournament."
            );
        }

        long approvedCount =
                registrationRepository
                        .countByTournamentIdAndApprovalStatusIn(
                                tournament.getTournamentId(),
                                List.of(RegistrationStatus.APPROVED)
                        );

        if (approvedCount >= tournament.getMaxRegistrations()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament has reached its approved registration capacity."
            );
        }
    }

    private void validateSubmissionWindow(Tournament tournament) {
        LocalDateTime now = LocalDateTime.now();

        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(
                tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament is not open for registration."
            );
        }

        if (now.isBefore(tournament.getRegistrationOpenAt())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament registration has not opened yet."
            );
        }

        if (now.isAfter(tournament.getRegistrationCloseAt())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament registration is closed."
            );
        }
    }

    private void validateOriginalSubmissionTime(
            Registration registration,
            Tournament tournament
    ) {
        LocalDateTime submittedAt = registration.getSubmittedAt();

        if (submittedAt == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration submission time is missing."
            );
        }

        if (submittedAt.isBefore(tournament.getRegistrationOpenAt())
                || submittedAt.isAfter(
                tournament.getRegistrationCloseAt())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration was submitted outside the registration window."
            );
        }
    }

    private void validateOwner(User owner) {
        if (!ACTIVE.equalsIgnoreCase(owner.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Owner account is not active."
            );
        }

        if (owner.getRole() == null
                || !"OWNER".equalsIgnoreCase(
                owner.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration owner does not have the OWNER role."
            );
        }
    }

    private void validateHorseOwnership(
            Horse horse,
            Integer ownerId
    ) {
        if (!Objects.equals(horse.getOwnerId(), ownerId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Selected horse does not belong to the owner."
            );
        }
    }

    private void validateHorse(
            Horse horse,
            Tournament tournament
    ) {
        if (!ACTIVE.equalsIgnoreCase(horse.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse is not active."
            );
        }

        if (horse.getHealthCertExpiry() == null
                || horse.getHealthCertExpiry()
                .isBefore(tournament.getStartDate())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse health certificate expires before the tournament starts."
            );
        }

        if (horse.getAge() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse age is missing."
            );
        }

        if (horse.getWeight() == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse weight is missing."
            );
        }
    }

    private void validateJockey(Integer jockeyId) {
        User jockey = getUser(jockeyId, "Jockey");

        if (jockey.getRole() == null
                || !"JOCKEY".equalsIgnoreCase(
                jockey.getRole().getRoleName())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Selected user does not have the JOCKEY role."
            );
        }

        if (!ACTIVE.equalsIgnoreCase(jockey.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Jockey account is not active."
            );
        }

        jockeyProfileRepository
                .findById(jockeyId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Jockey profile does not exist."
                ));
    }

    private void validateConditions(
            Horse horse,
            Tournament tournament
    ) {
        List<TournamentCondition> conditions =
                conditionRepository
                        .findByTournamentIdOrderByConditionIdAsc(
                                tournament.getTournamentId()
                        );

        for (TournamentCondition condition : conditions) {
            switch (condition.getConditionType()) {
                case ConditionType.AGE ->
                        validateAgeCondition(
                                horse,
                                tournament,
                                condition
                        );

                case ConditionType.GENDER ->
                        validateGenderCondition(horse, condition);

                case ConditionType.WEIGHT ->
                        validateWeightCondition(horse, condition);

                default -> throw new ApiException(
                        HttpStatus.CONFLICT,
                        "Tournament contains an unsupported condition."
                );
            }
        }
    }

    private void validateAgeCondition(
            Horse horse,
            Tournament tournament,
            TournamentCondition condition
    ) {
        long horseAge = horse.getAge();

        if (horseAge < 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse date of birth is invalid."
            );
        }

        validateNumericValue(
                BigDecimal.valueOf(horseAge),
                condition,
                "Horse does not satisfy the tournament age condition."
        );
    }

    private void validateWeightCondition(
            Horse horse,
            TournamentCondition condition
    ) {
        validateNumericValue(
                horse.getWeight(),
                condition,
                "Horse does not satisfy the tournament weight condition."
        );
    }

    private void validateGenderCondition(
            Horse horse,
            TournamentCondition condition
    ) {
        if (!ConditionOperator.EQ.equals(condition.getOperator())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Gender condition has an invalid operator."
            );
        }

        if (horse.getSex() == null
                || condition.getValue() == null
                || !horse.getSex().trim().equalsIgnoreCase(
                condition.getValue().trim())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse does not satisfy the tournament gender condition."
            );
        }
    }

    private void validateNumericValue(
            BigDecimal actualValue,
            TournamentCondition condition,
            String failureMessage
    ) {
        boolean valid;

        switch (condition.getOperator()) {
            case ConditionOperator.EQ ->
                    valid = actualValue.compareTo(
                            parseConditionValue(condition)) == 0;

            case ConditionOperator.GT ->
                    valid = actualValue.compareTo(
                            parseConditionValue(condition)) > 0;

            case ConditionOperator.GTE ->
                    valid = actualValue.compareTo(
                            parseConditionValue(condition)) >= 0;

            case ConditionOperator.LT ->
                    valid = actualValue.compareTo(
                            parseConditionValue(condition)) < 0;

            case ConditionOperator.LTE ->
                    valid = actualValue.compareTo(
                            parseConditionValue(condition)) <= 0;

            case ConditionOperator.BETWEEN ->
                    valid = condition.getMinValue() != null
                            && condition.getMaxValue() != null
                            && actualValue.compareTo(
                            condition.getMinValue()) >= 0
                            && actualValue.compareTo(
                            condition.getMaxValue()) <= 0;

            default -> throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament condition has an invalid operator."
            );
        }

        if (!valid) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    failureMessage
            );
        }
    }

    private BigDecimal parseConditionValue(
            TournamentCondition condition
    ) {
        try {
            return new BigDecimal(condition.getValue());
        } catch (NumberFormatException | NullPointerException exception) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament condition contains an invalid numeric value."
            );
        }
    }

    private Horse getHorse(Integer horseId) {
        return horseRepository.findById(horseId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Horse does not exist."
                ));
    }

    private User getUser(Integer userId, String type) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        type + " does not exist."
                ));
    }
}
