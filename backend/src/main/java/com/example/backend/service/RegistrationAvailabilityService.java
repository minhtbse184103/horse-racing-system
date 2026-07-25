package com.example.backend.service;

import com.example.backend.constant.RegistrationStatus;
import com.example.backend.entity.Horse;
import com.example.backend.entity.Tournament;
import com.example.backend.entity.User;
import com.example.backend.exception.ApiException;
import com.example.backend.repository.JockeyInvitationRepository;
import com.example.backend.repository.RegistrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistrationAvailabilityService {

    private static final String INVITATION_PENDING = "PENDING";
    private static final List<String> ACTIVE_REGISTRATION_STATUSES = List.of(
            RegistrationStatus.PENDING,
            RegistrationStatus.APPROVED
    );

    private final RegistrationRepository registrationRepository;
    private final JockeyInvitationRepository jockeyInvitationRepository;

    public RegistrationAvailabilityService(
            RegistrationRepository registrationRepository,
            JockeyInvitationRepository jockeyInvitationRepository
    ) {
        this.registrationRepository = registrationRepository;
        this.jockeyInvitationRepository = jockeyInvitationRepository;
    }

    public void validateInvitationCanBeCreated(
            Integer ownerId,
            Integer horseId,
            Integer jockeyId,
            Tournament tournament,
            Integer excludedInvitationId
    ) {
        validateOwnerForInvitation(ownerId, tournament.getTournamentId(), excludedInvitationId);
        validateHorseOverlappingAvailability(horseId, tournament, null, excludedInvitationId);
        validateJockeyOverlappingAvailability(jockeyId, tournament, null, excludedInvitationId);
    }

    public void validateAcceptedInvitationCanCreateRegistration(
            Integer ownerId,
            Integer horseId,
            Integer jockeyId,
            Tournament tournament,
            Integer excludedInvitationId
    ) {
        validateOwnerForInvitation(ownerId, tournament.getTournamentId(), excludedInvitationId);
        validateHorseSameTournament(horseId, tournament.getTournamentId(), null);
        validateHorseOverlappingAvailability(horseId, tournament, null, excludedInvitationId);
        validateJockeySameTournament(jockeyId, tournament.getTournamentId(), null);
        validateJockeyOverlappingAvailability(jockeyId, tournament, null, excludedInvitationId);
    }

    public void validateOwnerRegistrationCanBeCreated(
            Tournament tournament,
            Horse horse,
            User owner,
            User jockey
    ) {
        validateHorseSameTournamentForOwnerRegistration(horse.getHorseId(), tournament.getTournamentId());
        validateOwnerSameTournamentForOwnerRegistration(owner.getUserID(), tournament.getTournamentId());
        validateHorseRegistrationOverlapForOwnerRegistration(horse.getHorseId(), tournament);
        validateJockeyRegistrationAvailabilityForOwnerRegistration(jockey.getUserID(), tournament);
    }

    private void validateOwnerForInvitation(
            Integer ownerId,
            Integer tournamentId,
            Integer excludedInvitationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                tournamentId,
                ownerId,
                ACTIVE_REGISTRATION_STATUSES,
                null);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chủ ngựa đã có một đơn đăng ký đang hoạt động trong giải đấu này.");
        }

        if (jockeyInvitationRepository.existsPendingInvitationForTournamentAndOwner(
                tournamentId,
                ownerId,
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Chủ ngựa đã có một lời mời đang chờ xử lý trong giải đấu này.");
        }
    }

    private void validateHorseSameTournament(
            Integer horseId,
            Integer tournamentId,
            Integer excludedRegistrationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                tournamentId,
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    private void validateJockeySameTournament(
            Integer jockeyId,
            Integer tournamentId,
            Integer excludedRegistrationId
    ) {
        long activeRegistrations = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournamentId,
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                excludedRegistrationId);
        if (activeRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có đơn đăng ký đang hoạt động trong giải đấu.");
        }
    }

    private void validateHorseOverlappingAvailability(
            Integer horseId,
            Tournament tournament,
            Integer excludedRegistrationId,
            Integer excludedInvitationId
    ) {
        long overlappingRegistrations = registrationRepository.countByOverlappingTournamentAndHorseIdAndStatusInExcludingRegistration(
                horseId,
                tournament.getStartDate(),
                tournament.getEndDate(),
                ACTIVE_REGISTRATION_STATUSES,
                excludedRegistrationId);
        if (overlappingRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đã có đơn đăng ký ở giải đấu trùng thời gian.");
        }
        if (jockeyInvitationRepository.existsPendingOverlappingInvitationForHorse(
                horseId,
                tournament.getStartDate(),
                tournament.getEndDate(),
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ngựa này đã có lời mời đang chờ xử lý ở giải đấu trùng thời gian.");
        }
    }

    private void validateJockeyOverlappingAvailability(
            Integer jockeyId,
            Tournament tournament,
            Integer excludedRegistrationId,
            Integer excludedInvitationId
    ) {
        long overlappingRegistrations = registrationRepository.countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
                jockeyId,
                tournament.getStartDate(),
                tournament.getEndDate(),
                ACTIVE_REGISTRATION_STATUSES,
                excludedRegistrationId);
        if (overlappingRegistrations > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có đơn đăng ký ở giải đấu trùng thời gian.");
        }

        if (jockeyInvitationRepository.existsPendingOverlappingInvitationForJockey(
                jockeyId,
                tournament.getStartDate(),
                tournament.getEndDate(),
                INVITATION_PENDING,
                LocalDateTime.now(),
                excludedInvitationId)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Nài ngựa này đã có lời mời đang chờ xử lý ở giải đấu trùng thời gian.");
        }
    }

    private void validateHorseSameTournamentForOwnerRegistration(
            Integer horseId,
            Integer tournamentId
    ) {
        long duplicateCount = registrationRepository.countByTournamentIdAndHorseIdAndStatusInExcludingRegistration(
                tournamentId,
                horseId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (duplicateCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse already has an active registration in this tournament.");
        }
    }

    private void validateOwnerSameTournamentForOwnerRegistration(
            Integer ownerId,
            Integer tournamentId
    ) {
        long duplicateCount = registrationRepository.countByTournamentIdAndOwnerIdAndStatusInExcludingRegistration(
                tournamentId,
                ownerId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (duplicateCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Owner already has an active registration in this tournament.");
        }
    }

    private void validateHorseRegistrationOverlapForOwnerRegistration(
            Integer horseId,
            Tournament tournament
    ) {
        long overlappingCount = registrationRepository.countByOverlappingTournamentAndHorseIdAndStatusInExcludingRegistration(
                horseId,
                tournament.getStartDate(),
                tournament.getEndDate(),
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (overlappingCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Horse already has an active registration in an overlapping tournament.");
        }
    }

    private void validateJockeyRegistrationAvailabilityForOwnerRegistration(
            Integer jockeyId,
            Tournament tournament
    ) {
        long sameTournamentCount = registrationRepository.countByTournamentIdAndJockeyIdAndStatusInExcludingRegistration(
                tournament.getTournamentId(),
                jockeyId,
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (sameTournamentCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Jockey already has an active registration in this tournament.");
        }

        long overlappingCount = registrationRepository.countByOverlappingTournamentAndJockeyIdAndStatusInExcludingRegistration(
                jockeyId,
                tournament.getStartDate(),
                tournament.getEndDate(),
                ACTIVE_REGISTRATION_STATUSES,
                null);

        if (overlappingCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Jockey already has an active registration in an overlapping tournament.");
        }
    }
}
