package com.example.backend.service;

import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.response.AdminRegistrationResponse;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Registration;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.HorseRepository;
import com.example.backend.repository.RegistrationRepository;
import com.example.backend.repository.UserRepository;


import com.example.backend.constant.EventStatus;
import com.example.backend.entity.JockeyProfile;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.TournamentCondition;
import com.example.backend.repository.JockeyProfileRepository;
import com.example.backend.repository.TournamentConditionRepository;
import com.example.backend.repository.TournamentRepository;

@Service
public class AdminRegistrationService {
    private static final String ACTIVE = "ACTIVE";
    private static final String JOCKEY_PROFILE_READY = "READY";
    private static final String ACCEPTED = "ACCEPTED";
    private static final String CONFIRMED = "CONFIRMED";
    private static final String REJECTED = "REJECTED";

    private final RegistrationRepository registrationRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final TournamentRepository tournamentRepository;
    private final TournamentConditionRepository tournamentConditionRepository;
    private final JockeyProfileRepository jockeyProfileRepository;

    public AdminRegistrationService(
            RegistrationRepository registrationRepository,
            HorseRepository horseRepository,
            UserRepository userRepository,
            TournamentRepository tournamentRepository,
            TournamentConditionRepository tournamentConditionRepository,
            JockeyProfileRepository jockeyProfileRepository,
            JdbcTemplate jdbcTemplate) {

        this.registrationRepository = registrationRepository;
        this.horseRepository = horseRepository;
        this.userRepository = userRepository;
        this.tournamentRepository = tournamentRepository;
        this.tournamentConditionRepository = tournamentConditionRepository;
        this.jockeyProfileRepository = jockeyProfileRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<AdminRegistrationResponse> getAcceptedRegistrations() {
        return registrationRepository.findByStatusOrderByUpdatedAtAsc(ACCEPTED)
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminRegistrationResponse> getRegistrationHistory() {
        return registrationRepository
                .findByStatusInOrderByUpdatedAtDesc(
                        List.of(CONFIRMED, REJECTED))
                .stream()
                .map(this::mapResponse)
                .toList();
    }

    @Transactional
    public AdminRegistrationResponse confirmRegistration(Integer registrationId) {
        Registration registration = getAcceptedRegistration(registrationId);

        validateRegistrationForConfirmation(registration);

        registration.setStatus(CONFIRMED);
        return mapResponse(registrationRepository.save(registration));
    }

    @Transactional
    public AdminRegistrationResponse rejectRegistration(Integer registrationId) {
        Registration registration = getAcceptedRegistration(registrationId);
        registration.setStatus(REJECTED);
        return mapResponse(registrationRepository.save(registration));
    }

    private Registration getAcceptedRegistration(Integer registrationId) {
        Registration registration = registrationRepository.findByIdForUpdate(registrationId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, "Registration does not exist."));

        if (!ACCEPTED.equals(registration.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only accepted registrations can be reviewed.");
        }

        return registration;
    }

    private AdminRegistrationResponse mapResponse(Registration registration) {
        Horse horse = horseRepository.findById(registration.getHorseId()).orElse(null);
        User owner = userRepository.findById(registration.getOwnerId()).orElse(null);
        User jockey = registration.getJockeyId() != null
                ? userRepository.findById(registration.getJockeyId()).orElse(null)
                : null;

        String tournamentName = jdbcTemplate.queryForObject(
                "SELECT tournamentName FROM Tournament WHERE tournamentID = ?",
                String.class,
                registration.getTournamentId());

        return AdminRegistrationResponse.builder()
                .registrationId(registration.getRegistrationId())
                .tournamentId(registration.getTournamentId())
                .tournamentName(tournamentName)
                .horseId(registration.getHorseId())
                .horseName(horse != null ? horse.getHorseName() : null)
                .ownerId(registration.getOwnerId())
                .ownerName(owner != null ? owner.getFullName() : null)
                .jockeyId(registration.getJockeyId())
                .jockeyName(jockey != null ? jockey.getFullName() : null)
                .status(registration.getStatus())
                .createdAt(registration.getCreatedAt())
                .updatedAt(registration.getUpdatedAt())
                .build();
    }
    private void validateRegistrationForConfirmation(Registration registration) {
        Tournament tournament = getTournamentForUpdate(registration.getTournamentId());
        validateTournament(tournament);

        TournamentCondition condition = getTournamentCondition(tournament.getConditionId());

        User owner = getUser(registration.getOwnerId(), "Owner");
        validateOwner(owner);

        Horse horse = getHorse(registration.getHorseId());
        validateHorse(registration, horse, tournament, condition);

        User jockey = getJockey(registration.getJockeyId());
        JockeyProfile jockeyProfile = getJockeyProfile(registration.getJockeyId());
        validateJockey(registration, jockey, jockeyProfile, condition);

        validateNoDuplicateConfirmedRegistration(registration);
        validateTournamentCapacity(tournament);
    }

    private Tournament getTournamentForUpdate(Integer tournamentId) {
        return tournamentRepository.findByIdForUpdate(tournamentId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, "Tournament does not exist."));
    }

    private TournamentCondition getTournamentCondition(Integer conditionId) {
        return tournamentConditionRepository.findById(conditionId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, "Tournament condition does not exist."));
    }

    private Horse getHorse(Integer horseId) {
        return horseRepository.findById(horseId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, "Horse does not exist."));
    }

    private User getUser(Integer userId, String userType) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, userType + " does not exist."));
    }

    private User getJockey(Integer jockeyId) {
        if (jockeyId == null) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration does not have an accepted jockey.");
        }

        return getUser(jockeyId, "Jockey");
    }

    private JockeyProfile getJockeyProfile(Integer jockeyId) {
        return jockeyProfileRepository.findById(jockeyId)
                .orElseThrow(() ->
                        new ApiException(HttpStatus.NOT_FOUND, "Jockey profile does not exist."));
    }
    private void validateTournament(Tournament tournament) {
        if (!EventStatus.OPEN_FOR_REGISTRATION.equals(tournament.getStatus())
                && !EventStatus.CLOSED_REGISTRATION.equals(tournament.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament must be open or closed for registration.");
        }
    }

    private void validateOwner(User owner) {
        if (!ACTIVE.equals(owner.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Owner account is not active.");
        }
    }
    private void validateHorse(
            Registration registration,
            Horse horse,
            Tournament tournament,
            TournamentCondition condition) {

        if (!Objects.equals(horse.getOwnerId(), registration.getOwnerId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse does not belong to the registration owner.");
        }

        if (!ACTIVE.equals(horse.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse is not active.");
        }

        if (horse.getHealthCertExpiry() == null
                || horse.getHealthCertExpiry().isBefore(tournament.getStartDate())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse health certificate expires before the tournament starts.");
        }

        if (horse.getWeight() == null
                || horse.getWeight().compareTo(condition.getMaxHorseWeight()) > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse exceeds the tournament weight limit.");
        }
    }
    private void validateJockey(
            Registration registration,
            User jockey,
            JockeyProfile jockeyProfile,
            TournamentCondition condition) {

        if (!Objects.equals(jockey.getUserID(), registration.getJockeyId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Registration jockey is invalid.");
        }

        if (!ACTIVE.equals(jockey.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Jockey account is not active.");
        }

        if (!JOCKEY_PROFILE_READY.equals(jockeyProfile.getStatus())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Jockey profile is not ready.");
        }

        if (jockeyProfile.getWeight() == null
                || jockeyProfile.getWeight()
                .compareTo(condition.getMaxJockeyWeight()) > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Jockey exceeds the tournament weight limit.");
        }
    }
    private void validateTournamentCapacity(Tournament tournament) {
        long confirmedCount = registrationRepository.countByTournamentIdAndStatusIn(
                tournament.getTournamentId(),
                List.of(CONFIRMED));

        if (confirmedCount >= tournament.getMaxParticipants()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Tournament has reached maximum participants.");
        }
    }

    private void validateNoDuplicateConfirmedRegistration(
            Registration registration) {

        long confirmedHorseCount =
                registrationRepository
                        .countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                                registration.getTournamentId(),
                                registration.getHorseId(),
                                List.of(CONFIRMED),
                                registration.getRegistrationId());

        if (confirmedHorseCount > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Horse already has a confirmed registration for this tournament.");
        }

        long confirmedJockeyCount =
                registrationRepository
                        .countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                                registration.getTournamentId(),
                                registration.getJockeyId(),
                                List.of(CONFIRMED),
                                registration.getRegistrationId());

        if (confirmedJockeyCount > 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Jockey already has a confirmed registration for this tournament.");
        }
    }

}
